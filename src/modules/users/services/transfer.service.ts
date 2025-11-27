// src/users/services/transfer.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';

import * as crypto from 'crypto';

import { Transfer, TransferStatus } from '../entities/transfer.entity';
import { Users } from '../entities/users.entity';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import {
  Transaction,
  TransactionStatus,
} from '../../double-entry-ledger/entities/transaction.entity';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { TransferFilterDto, TransactionType } from '../dto/transfer-filter.dto';
import { FeePercentageService } from 'src/modules/constants/services/fee-percentage.service';

// ⚠️ Adjust these paths if your NFC entities live elsewhere
import { NfcOfflineToken } from 'src/modules/nfc/entities/nfc-offline-token.entity';
import { NfcDevice } from 'src/modules/nfc/entities/nfc-device.entity';

@Injectable()
export class TransferService {
  private static logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationsService,
    private readonly feePercentageService: FeePercentageService,
  ) {}

  // ---------------------------------------------------------------------------
  // Transform helpers
  // ---------------------------------------------------------------------------
  static transformTransfer(user_id: number, transfer: Transfer) {
    TransferService.logger.debug({
      function: 'transformTransfer',
      user_id,
      transfer,
    });

    let amount = transfer.amount;
    let targetName = transfer.sender.name;

    if (user_id === transfer.sender_user_id) {
      amount = -amount;
      targetName = transfer.receiver.name;
    }

    return {
      id: transfer.id,
      amount,
      targetName,
      created_at: transfer.created_at,
    };
  }

  static transformTransfers(user_id: number, transfers: Transfer[]) {
    TransferService.logger.debug({
      function: 'transformTransfers',
      user_id,
      transfers,
    });
    return transfers.map((transfer) =>
      TransferService.transformTransfer(user_id, transfer),
    );
  }

  // ---------------------------------------------------------------------------
  // Secure token + ed25519 signature verification
  // ---------------------------------------------------------------------------
  /**
   * Verifies that:
   *  1. NFC offline token exists for dto.token
   *  2. Optionally belongs to this user (if user_id present on token)
   *  3. Token is unused and unexpired
   *  4. Related NfcDevice has public_key_pem
   *  5. Ed25519 signature (dto.signature) is valid for:
   *     canonical = [ user.id, receiver_phone_number, amount, token.nonce, dto.expires_at ?? '' ].join('|')
   */
  private async verifyTransferTokenAndSignatureOrThrow(
    user: IUserIdentity,
    dto: CreateTransferDto,
    manager: EntityManager,
  ): Promise<NfcOfflineToken> {
    if (!dto.token || !dto.signature) {
      throw new BadRequestException(
        'Transfer token and signature are required.',
      );
    }

    if (!dto.expires_at) {
      throw new BadRequestException('Transfer token expiry (expires_at) missing.');
    }

    // 1) Fetch token by nonce with pessimistic lock
    const token = await manager.findOne(NfcOfflineToken, {
      where: { nonce: dto.token },
      lock: { mode: 'pessimistic_write' },
    });

    if (!token) {
      throw new BadRequestException('Invalid or unknown transfer token.');
    }

    // 2) Optional ownership check (if user_id exists)
    const tokenUserIdRaw =
      (token as any).user_id ??
      (token as any).userId ??
      null;

    const tokenUserId =
      tokenUserIdRaw !== null && tokenUserIdRaw !== undefined
        ? Number(tokenUserIdRaw)
        : null;

    if (tokenUserId !== null && tokenUserId !== user.id) {
      throw new BadRequestException('Transfer token does not belong to this user.');
    }

    if (tokenUserId === null) {
      TransferService.logger.debug({
        function: 'verifyTransferTokenAndSignatureOrThrow',
        msg: 'NfcOfflineToken has no user_id; skipping strict ownership check',
        token_id: (token as any).id,
        nonce: (token as any).nonce,
      });
    }

    // 3) Not used
    if ((token as any).used) {
      throw new BadRequestException('Transfer token has already been used.');
    }

    // 4) Not expired
    const now = Date.now();
    const dbExp = (token as any).expires_at;
    const dbExpMs =
      dbExp instanceof Date ? dbExp.getTime() : new Date(dbExp).getTime();

    if (!Number.isFinite(dbExpMs) || dbExpMs <= now) {
      throw new BadRequestException('Transfer token is expired.');
    }

    // 5) Load public key from nfc_devices via device_id
    let publicKeyPem: string | null = null;

    const tokenDevice =
      (token as any).device ??
      (token as any).nfcDevice ??
      null;

    if (tokenDevice && tokenDevice.public_key_pem) {
      publicKeyPem = tokenDevice.public_key_pem;
    } else {
      const deviceId =
        (token as any).device_id ??
        (token as any).nfc_device_id ??
        (token as any).nfcDeviceId ??
        null;

      if (deviceId) {
        const device = await manager.findOne(NfcDevice, {
          where: { id: deviceId },
        });

        if (device && (device as any).public_key_pem) {
          publicKeyPem = (device as any).public_key_pem;
        } else {
          TransferService.logger.error({
            function: 'verifyTransferTokenAndSignatureOrThrow',
            reason: 'NfcDevice found but has no public_key_pem',
            deviceId,
            device,
          });
        }
      } else {
        TransferService.logger.error({
          function: 'verifyTransferTokenAndSignatureOrThrow',
          reason: 'No device_id on NfcOfflineToken',
          token,
        });
      }
    }

    if (!publicKeyPem) {
      throw new BadRequestException(
        'No public key associated with this transfer token (missing public_key_pem).',
      );
    }

    // 6) Canonical payload — MUST match frontend signing logic
    //    Frontend: [user.id, receiverPhone, amountCents, tokenNonce, tokenExpiresAt].join('|')
    const canonical = [
      user.id,
      dto.receiver_phone_number,
      dto.amount,           // minor units (cents)
      (token as any).nonce,
      dto.expires_at ?? '',
    ].join('|');

    let signatureBuf: Buffer;
    try {
      signatureBuf = Buffer.from(dto.signature, 'hex');
    } catch {
      throw new BadRequestException('Invalid transfer signature format (hex).');
    }

    const dataBuf = Buffer.from(canonical, 'utf8');

    // 7) Build a proper Ed25519 public key for Node crypto
    let isValid = false;
    try {
      // Extract base64 body from PEM and decode
      const pemBody = publicKeyPem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s+/g, '');
      const keyBytes = Buffer.from(pemBody, 'base64');

      let keyObj: crypto.KeyObject;

      if (keyBytes.length === 32) {
        // Raw 32-byte Ed25519 public key: wrap into SPKI DER
        const ed25519SpkiPrefix = Buffer.from([
          0x30, 0x2a,             // SEQUENCE, len 42
          0x30, 0x05,             // SEQUENCE, len 5
          0x06, 0x03, 0x2b, 0x65, 0x70, // OID 1.3.101.112 (Ed25519)
          0x03, 0x21, 0x00,       // BIT STRING, len 33, unused bits = 0
        ]);
        const der = Buffer.concat([ed25519SpkiPrefix, keyBytes]);
        keyObj = crypto.createPublicKey({
          key: der,
          format: 'der',
          type: 'spki',
        });
      } else {
        // Assume it's already SPKI / valid PEM
        keyObj = crypto.createPublicKey({
          key: publicKeyPem,
          format: 'pem',
          type: 'spki',
        });
      }

      isValid = crypto.verify(null, dataBuf, keyObj, signatureBuf);
    } catch (err) {
      TransferService.logger.error({
        function: 'verifyTransferTokenAndSignatureOrThrow',
        error: (err as any)?.message || String(err),
        publicKeyPemSnippet: publicKeyPem.slice(0, 80),
      });

      throw new BadRequestException(
        'Failed to verify transfer signature: ' +
          ((err as any)?.message || 'crypto.verify error'),
      );
    }

    if (!isValid) {
      throw new BadRequestException('Invalid transfer signature.');
    }

    TransferService.logger.debug({
      function: 'verifyTransferTokenAndSignatureOrThrow',
      message: 'Transfer token & signature verified',
      user_id: user.id,
      receiver_phone_number: dto.receiver_phone_number,
      amount: dto.amount,
      token: dto.token,
    });

    return token;
  }

  // ---------------------------------------------------------------------------
  // Get transfers list
  // ---------------------------------------------------------------------------
  async getTransfers(id: number, filterDto: TransferFilterDto): Promise<any> {
    TransferService.logger.debug({
      function: 'getTransfers',
      id,
      filterDto,
    });

    const {
      limit,
      offset,
      transactionType,
      from,
      to,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
    } = filterDto;

    const queryBuilder = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.sender', 'sender')
      .leftJoinAndSelect('transfer.receiver', 'receiver')
      .select([
        'transfer.id',
        'transfer.sender_user_id',
        'transfer.receiver_user_id',
        'transfer.amount',
        'transfer.status',
        'transfer.transaction_id',
        'transfer.created_at',
        'sender.id',
        'sender.name',
        'receiver.id',
        'receiver.name',
      ]);

    if (transactionType === TransactionType.SEND) {
      queryBuilder.where('transfer.sender_user_id = :userId', { userId: id });
    } else if (transactionType === TransactionType.RECEIVE) {
      queryBuilder.where('transfer.receiver_user_id = :userId', { userId: id });
    } else {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('transfer.sender_user_id = :userId', { userId: id }).orWhere(
            'transfer.receiver_user_id = :userId',
            { userId: id },
          );
        }),
      );
    }

    if (from) {
      queryBuilder.andWhere('sender.name LIKE :from', { from: `%${from}%` });
    }
    if (to) {
      queryBuilder.andWhere('receiver.name LIKE :to', { to: `%${to}%` });
    }

    if (minAmount && maxAmount) {
      queryBuilder.andWhere(
        'transfer.amount BETWEEN :minAmount AND :maxAmount',
        {
          minAmount,
          maxAmount,
        },
      );
    } else if (minAmount) {
      queryBuilder.andWhere('transfer.amount >= :minAmount', { minAmount });
    } else if (maxAmount) {
      queryBuilder.andWhere('transfer.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere(
        'DATE(transfer.created_at) BETWEEN DATE(:fromDate) AND DATE(:toDate)',
        {
          fromDate,
          toDate,
        },
      );
    } else if (fromDate) {
      queryBuilder.andWhere('DATE(transfer.created_at) >= DATE(:fromDate)', {
        fromDate,
      });
    } else if (toDate) {
      queryBuilder.andWhere('DATE(transfer.created_at) <= DATE(:toDate)', {
        toDate,
      });
    }

    const transfers = await queryBuilder
      .orderBy('transfer.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return TransferService.transformTransfers(id, transfers);
  }

  // ---------------------------------------------------------------------------
  // Create transfer (protected by ed25519 + NFC offline token)
  // ---------------------------------------------------------------------------
  async create(
    user: IUserIdentity,
    dto: CreateTransferDto,
  ): Promise<Transaction> {
    TransferService.logger.debug({
      function: 'create',
      user,
      dto,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1) Verify NFC offline token + signature
      const nfcToken = await this.verifyTransferTokenAndSignatureOrThrow(
        user,
        dto,
        queryRunner.manager,
      );

      // 2) Load receiver & accounts
      const receiverUser = await this.usersRepository.findOne({
        where: { phone_number: dto.receiver_phone_number },
        relations: ['accounts'],
      });

      const receiverUserWithUSDAccount = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.accounts', 'account')
        .where('user.phone_number = :phoneNumber', {
          phoneNumber: dto.receiver_phone_number,
        })
        .andWhere('account.currency = :currency', { currency: 'USDT' })
        .getOne();

      const userAccount = await this.accountService.findByUserId(user.id);

      if (!userAccount || !receiverUser || !receiverUserWithUSDAccount) {
        throw new NotFoundException('Receiver account not found');
      }

      if (userAccount.available_balance < dto.amount) {
        throw new BadRequestException(
          'Insufficient balance to complete the transfer',
        );
      }

      const transferFeeAccount =
        await this.accountService.getTransferFeeAccount();

      const feePercentage = await this.feePercentageService.getPercentageByType(
        'transfer_fee_percentage',
      );

      let fee = dto.amount * feePercentage;
      // if (fee < 5) { fee = 5; } // optional minimum fee

      // 3) Ledger transaction (double-entry)
      const savedTransaction = await this.transactionService.create(
        {
          transaction_date: new Date().toISOString(),
          status: TransactionStatus.POSTED,
          entries: [
            {
              account_id: userAccount.id,
              type: EntryType.DEBIT,
              amount: dto.amount,
            },
            {
              account_id: receiverUserWithUSDAccount.accounts[0].id,
              type: EntryType.CREDIT,
              amount: dto.amount - fee,
            },
            {
              account_id: transferFeeAccount.id,
              type: EntryType.CREDIT,
              amount: fee,
            },
          ],
        },
        queryRunner.manager,
      );

      // 4) Transfer record
      const transfer = this.transferRepository.create({
        sender_user_id: user.id,
        receiver_user_id: receiverUser.id,
        amount: dto.amount - fee,
        fees_amount: fee,
        transaction_id: savedTransaction.id,
        status: TransferStatus.SUCCESS,
      });

      // 5) Notifications
      const notification1 =
        await this.notificationService.createNotification(
          'Successful Transfer',
          `You received ${(dto.amount / 100).toFixed(2)}$ from ${user.name}`,
          'تحويل ناجح',
          `وصلتك حوالة من ${user.name} بقيمة ${(dto.amount / 100).toFixed(
            2,
          )}$`,
          receiverUser.id,
          savedTransaction.id,
        );

      const notification2 =
        await this.notificationService.createNotification(
          'Successful Transfer',
          `You sent ${(dto.amount / 100).toFixed(2)}$ to ${receiverUser.name}`,
          'تحويل ناجح',
          `قمت بإرسال ${(dto.amount / 100).toFixed(2)}$ الى ${
            receiverUser.name
          }`,
          user.id,
          savedTransaction.id,
        );

      await queryRunner.manager.save(transfer);
      await queryRunner.manager.save([notification1, notification2]);

      // 6) Mark NFC token as used
      (nfcToken as any).used = true;
      (nfcToken as any).used_at = new Date();
      await queryRunner.manager.save(nfcToken);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
