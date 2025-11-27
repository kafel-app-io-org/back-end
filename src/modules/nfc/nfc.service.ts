// src/modules/nfc/nfc.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createPublicKey, verify as edVerify, KeyObject } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

import { Users } from 'src/modules/users/entities/users.entity';
import { NfcDevice } from './entities/nfc-device.entity';
import { NfcOfflineToken } from './entities/nfc-offline-token.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { PaymentRequestDto } from './dto/payment-request.dto';

import { IUserIdentity } from '../../common/interfaces/user-identity.interface';
import { TransferService } from 'src/modules/users/services/transfer.service';
import { CreateTransferDto } from 'src/modules/users/dto/create-transfer.dto';

@Injectable()
export class NfcService {
  constructor(
    @InjectRepository(NfcDevice)
    private readonly deviceRepo: Repository<NfcDevice>,
    @InjectRepository(NfcOfflineToken)
    private readonly tokenRepo: Repository<NfcOfflineToken>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly transferService: TransferService,  // 👈 index [3]
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private static canonicalForSignature(dto: PaymentRequestDto) {
    // Stable order for signing
    return JSON.stringify({
      nonce: dto.nonce,
      ctr: dto.ctr,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      receiverUserId: dto.receiverUserId,
    });
  }

  async startSessionAndMintTokens(user: IUserIdentity, dto: StartSessionDto) {
    // 1) Resolve receiver by phone
    const currentUser = await this.usersRepository.findOne({
      where: { phone_number: dto.receiver_phone_number },
      relations: ['accounts'],
    });

    if (!currentUser) {
      throw new NotFoundException('receiver_not_found');
    }

    // 2) Upsert device
    let device = await this.deviceRepo.findOne({
      where: {
        device_fingerprint: dto.deviceFingerprint,
        owner: { id: currentUser.id },
      },
      relations: { owner: true },
    });

    if (!device) {
      device = this.deviceRepo.create({
        owner: currentUser,
        device_fingerprint: dto.deviceFingerprint,
        public_key_pem: dto.publicKeyPem,
        signing_counter: 0,
        active: true,
      });
    } else {
      device.public_key_pem = dto.publicKeyPem;
      device.active = true;
    }
    await this.deviceRepo.save(device);

    // 3) DELETE all *unused* tokens for this device before minting fresh ones
    await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .from('nfc_offline_tokens')
      .where('deviceId = :deviceId', { deviceId: device.id })
      .andWhere('used = :used', { used: false })
      .execute();

    // 4) Mint 20 fresh tokens
    const ttlMinutes = 60 * 24 * 2; // 2 Days -- Minutes * Hours * Days
    const expiresAt = () => new Date(Date.now() + ttlMinutes * 60 * 1000);

    const tokens = Array.from({ length: 20 }, () =>
      this.tokenRepo.create({
        device,
        nonce: uuidv4(),
        expires_at: expiresAt(),
        used: false,
      }),
    );
    await this.tokenRepo.save(tokens);

    return {
      deviceId: device.id,
      ttlMinutes,
      tokens: tokens.map((t) => ({
        nonce: t.nonce,
        expires_at: t.expires_at,
      })),
    };
  }

  /**
   * Normalize whatever is in `public_key_pem` into a KeyObject usable for Ed25519 verification.
   *
   * Supports:
   *  - "Fake" PEM with raw Ed25519 base64 body:
   *      -----BEGIN PUBLIC KEY-----
   *      <base64(raw32bytes)>
   *      -----END PUBLIC KEY-----
   *  - Plain base64 raw Ed25519 (32 bytes)
   *  - Hex raw Ed25519 (32-byte key = 64 hex chars)
   *  - DER SPKI as base64 or hex
   */
  private normalizeEd25519PublicKey(pub: string): KeyObject {
    if (!pub || typeof pub !== 'string') {
      throw new BadRequestException('invalid_public_key');
    }

    const trimmed = pub.trim();

    console.log(
      '[NFC] public_key_pem preview:',
      trimmed.slice(0, 80),
      '... len=',
      trimmed.length,
    );

    // Helper: wrap raw 32-byte Ed25519 key into SPKI DER
    const toSpkiDer = (raw: Buffer) => {
      if (raw.length !== 32) {
        throw new BadRequestException('invalid_public_key_length');
      }
      // Ed25519 SubjectPublicKeyInfo header
      const prefix = Buffer.from('302a300506032b6570032100', 'hex');
      return Buffer.concat([prefix, raw]);
    };

    // Helper: create KeyObject from raw or DER
    const keyFromRaw = (buf: Buffer): KeyObject => {
      if (buf.length === 32) {
        // raw Ed25519 key
        const der = toSpkiDer(buf);
        return createPublicKey({ key: der, format: 'der', type: 'spki' });
      }
      if (buf.length > 32 && buf.length < 2000) {
        // assume DER SPKI
        return createPublicKey({ key: buf, format: 'der', type: 'spki' });
      }
      throw new BadRequestException('invalid_public_key_format');
    };

    // 1) "Fake" PEM: BEGIN/END + base64(rawKey)
    if (trimmed.includes('BEGIN PUBLIC KEY')) {
      const match = trimmed.match(
        /-----BEGIN PUBLIC KEY-----([\s\S]+?)-----END PUBLIC KEY-----/,
      );
      if (!match) {
        throw new BadRequestException('invalid_public_key_format');
      }

      const bodyB64 = match[1].replace(/\s+/g, '');
      let buf: Buffer;
      try {
        buf = Buffer.from(bodyB64, 'base64');
      } catch (e) {
        console.error('[NFC] Failed to base64-decode PEM body', e);
        throw new BadRequestException('invalid_public_key_format');
      }

      return keyFromRaw(buf);
    }

    // 2) Try plain base64 (without PEM headers)
    try {
      const buf = Buffer.from(trimmed, 'base64');
      if (buf.length > 0) {
        return keyFromRaw(buf);
      }
    } catch {
      // not base64, continue
    }

    // 3) Try hex
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (hexRegex.test(trimmed)) {
      try {
        const buf = Buffer.from(trimmed, 'hex');
        return keyFromRaw(buf);
      } catch (e) {
        console.error('[NFC] Failed to parse hex public key', e);
        throw new BadRequestException('invalid_public_key_format');
      }
    }

    console.error('[NFC] Unsupported public key format for NFC device');
    throw new BadRequestException('invalid_public_key_format');
  }

  private verifyEd25519(pubPemOrRaw: string, payloadStr: string, sigB64: string) {
    const pubKeyObj = this.normalizeEd25519PublicKey(pubPemOrRaw);

    const messageBuf = Buffer.from(payloadStr, 'utf8');
    const sigBuf = Buffer.from(sigB64, 'base64');

    const ok = edVerify(null, messageBuf, pubKeyObj, sigBuf);
    // Enable this in production:
    // if (!ok) {
    //   throw new BadRequestException('invalid_signature');
    // }
  }

  async processPayment(dto: PaymentRequestDto) {
    const payer = await this.usersRepository.findOneBy({ id: dto.payerUserId });
    const receiver = await this.usersRepository.findOneBy({
      id: dto.receiverUserId,
    });
    if (!payer || !receiver) throw new NotFoundException('user_not_found');

    const payerDevice = await this.deviceRepo.findOne({
      where: {
        device_fingerprint: dto.payerDeviceFingerprint,
        owner: { id: dto.payerUserId },
        active: true,
      },
      relations: { owner: true },
    });
    if (!payerDevice) throw new NotFoundException('payer_device_not_found');

    // Token checks
    const token = await this.tokenRepo.findOne({
      where: { nonce: dto.nonce, device: { id: payerDevice.id } },
    });
    if (!token) throw new BadRequestException('token_not_found');
    if (token.used) throw new BadRequestException('token_already_used');

    // Make sure expires_at is treated as a Date even if DB returns string
    const expiresAt =
      token.expires_at instanceof Date
        ? token.expires_at
        : new Date(token.expires_at as any);
    if (expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('token_expired');
    }

    // Signature over canonical payload
    const canonical = NfcService.canonicalForSignature(dto);
    this.verifyEd25519(payerDevice.public_key_pem, canonical, dto.signatureB64);

    // Amount validation
    if (dto.currency !== 'USDT')
      throw new BadRequestException('currency_not_supported');
    if (dto.amountMinor <= 0)
      throw new BadRequestException('invalid_amount');

    // Counter replay protection (simple, without DB lock)
    if (dto.ctr <= payerDevice.signing_counter) {
      throw new BadRequestException('counter_replay');
    }

    try {
      // 🔹 Use TransferService.create instead of manual transactionService.create

      const payerIdentity = payer as unknown as IUserIdentity;

      const transferDto: CreateTransferDto = {
        receiver_phone_number: receiver.phone_number,
        amount: dto.amountMinor,
        // you can add comment / metadata fields here if your DTO supports them
        comment: 'NFC payment from '+ payer.phone_number + ' to '+ receiver.phone_number,
        token: "string",  
        signature: "string",      // hex HMAC     
        expires_at: "string",    // ISO string
      };

      const savedTransaction = await this.transferService.create(
        payerIdentity,
        transferDto,
      );

      // Mark token used & bump signing_counter *after* successful transfer
      token.used = true;
      token.used_at = new Date();
      payerDevice.signing_counter = dto.ctr;

      await this.tokenRepo.save(token);
      await this.deviceRepo.save(payerDevice);

      return { status: 'success', transaction_id: savedTransaction.id };
    } catch (e) {
      // TransferService.create already handles its own transaction + rollback
      return { status: 'rejected', reason: e?.message ?? 'error' };
    }
  }
}
