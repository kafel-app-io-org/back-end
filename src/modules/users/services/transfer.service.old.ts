import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Transfer, TransferStatus } from '../entities/transfer.entity';
import { DataSource, Repository } from 'typeorm';
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
import { Brackets } from 'typeorm';
import { FeePercentageService } from 'src/modules/constants/services/fee-percentage.service'; 

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

    // Apply transaction type filter
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

    // Apply from/to filters
    if (from) {
      queryBuilder.andWhere('sender.name LIKE :from', { from: `%${from}%` });
    }

    if (to) {
      queryBuilder.andWhere('receiver.name LIKE :to', { to: `%${to}%` });
    }

    // Apply amount filters
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

    // Apply date filters
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

    // Apply pagination and ordering
    const transfers = await queryBuilder
      .orderBy('transfer.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return TransferService.transformTransfers(id, transfers);
  }

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

    const receiverUser = await this.usersRepository.findOne({
      where: { phone_number: dto.receiver_phone_number },
      relations: ['accounts'],
    });

    const receiverUserWithUSDAccount = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.accounts', 'account')
      .where('user.phone_number = :phoneNumber', {
        phoneNumber: dto.receiver_phone_number,
      }) // Filter user by phone number
      .andWhere('account.currency = :currency', { currency: 'USDT' })
      .getOne();

    const userAccount = await this.accountService.findByUserId(user.id);
    if (userAccount.available_balance < dto.amount) {
      throw new BadRequestException(
        'Insufficient balance to complete the transfer',
      );
    }

    const transferFeeAccount =
      await this.accountService.getTransferFeeAccount();

    if (!userAccount || !receiverUser) {
      throw new NotFoundException('receiver account not found');
    }
    const feePercentage = await this.feePercentageService.getPercentageByType(
      'transfer_fee_percentage',
    );
    let fee = dto.amount * feePercentage;
    //by RSR if (fee < 5) {
    //   fee = 5;
    // }
    try {
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

      const transfer = this.transferRepository.create({
        sender_user_id: user.id,
        receiver_user_id: receiverUser.id,
        amount: dto.amount - fee,
        fees_amount: fee,
        transaction_id: savedTransaction.id,
        status: TransferStatus.SUCCESS,
      });
      const notification1 = await this.notificationService.createNotification(
        'Successful Transfer',
        `You received ${(dto.amount / 100).toFixed(2)}$ from ${user.name}`,
        'تحويل ناجح',
        `وصلتك حوالة من ${user.name} بقيمة ${(dto.amount / 100).toFixed(2)}$`,
        receiverUser.id,
        savedTransaction.id,
      );
      const notification2 = await this.notificationService.createNotification(
        'Successful Transfer',
        `You sent ${(dto.amount / 100).toFixed(2)}$ to ${receiverUser.name}`,
        'تحويل ناجح',
        `قمت بإرسال ${(dto.amount / 100).toFixed(2)}$ الى ${receiverUser.name}`,
        user.id,
        savedTransaction.id,
      );
      await queryRunner.manager.save(transfer);
      await queryRunner.manager.save([notification1, notification2]);

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
