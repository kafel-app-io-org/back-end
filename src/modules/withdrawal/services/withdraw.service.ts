import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CryptoWithdrawService } from './crypto.withdraw.service';
import { BankWithdrawService } from './bank.withdraw.service';
import { CreateWithdrawDto } from '../dto/create-withdraw.dto';
import { DataSource, Repository } from 'typeorm';
import {
  MethodType,
  Withdraw,
  WithdrawStatus,
} from '../entities/withdraw.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { TransactionStatus } from '../../double-entry-ledger/entities/transaction.entity';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FeePercentageService } from 'src/modules/constants/services/fee-percentage.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class WithdrawService {
  private readonly logger = new Logger(WithdrawService.name);
  constructor(
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: Repository<Withdraw>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cryptoWithdrawService: CryptoWithdrawService,
    private readonly bankWithdrawService: BankWithdrawService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly notificationService: NotificationsService,
    private readonly feePercentageService: FeePercentageService,
  ) {}

  async create(user_id: number, dto: CreateWithdrawDto) {
    this.logger.debug({
      function: 'create',
      user_id,
      dto,
    });
    // let bank_account_id: number;

    // if (preferredWay === MethodType.BANK) {
    //   const bank_account = await this.bankWithdrawService.getByUserId(user_id);
    //   if (!bank_account)
    //     throw new NotFoundException('bank account does not exist');
    //   bank_account_id = bank_account.id;
    // } else if (preferredWay === MethodType.CRYPTO) {
    const crypto_account = await this.cryptoWithdrawService.getByUserId(
      user_id,
    );
    if (!crypto_account)
      throw new NotFoundException('crypto account does not exist');
    const crypto_account_id = crypto_account.id;
    // } else {
    //   throw new Error('Invalid method');
    // }
    const feePercentage = await this.feePercentageService.getPercentageByType(
      'withdraw_fee_percentage',
    );
    let fee = dto.amount * feePercentage;
    //by RSR if (fee < 5) {
    //   fee = 5;
    // }
    const withdraw = new Withdraw({
      ...dto,
      user_id,
      crypto_account_id,
      amount: dto.amount - fee,
      fees_amount: fee,
      type: MethodType.CRYPTO,
      status: WithdrawStatus.PENDING,
    });
    const notification = await this.notificationService.createNotification(
      'Pending Confirmation',
      `Your withdrawal of ${(dto.amount / 100).toFixed(
        2,
      )}$ is pending confirmation`,
      'إنتظار التأكيد',
      `سحبك للمبلغ ${(dto.amount / 100).toFixed(2)}$ بإنتظار التأكيد`,
      user_id,
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(withdraw);
      await queryRunner.manager.save(notification);
      await queryRunner.commitTransaction();
      return withdraw;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAccounts(user_id: number) {
    const [crypto, bank] = await Promise.all([
      this.cryptoWithdrawService.getByUserId(user_id),
      this.bankWithdrawService.getByUserId(user_id),
    ]);
    return {
      crypto,
      bank,
    };
  }

  async getPendingConfirmation(paginationDto: PaginationDto) {
    this.logger.debug({
      function: 'getPendingConfirmation',
      paginationDto,
    });

    const { limit, offset } = paginationDto;

    const queryBuilder = this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .leftJoin('withdraw.cryptoAccount', 'cryptoAccount')
      .leftJoin('withdraw.bankAccount', 'bankAccount')
      .addSelect(['user.id', 'user.name', 'user.phone_number'])
      .addSelect(['cryptoAccount.wallet_address', 'bankAccount.iban'])
      // destination = first non-null of wallet_address or iban
      .addSelect(
        "COALESCE(cryptoAccount.wallet_address, bankAccount.iban)",
        'destination' 
      )
      .where('withdraw.status = :status', { status: WithdrawStatus.PENDING })
      .skip(offset)
      .take(limit)
      .orderBy('withdraw.created_at', 'DESC');

    // const [withdraws, total] = await queryBuilder.getManyAndCount();

    // Get entities + total
    const [withdraws, total] = await queryBuilder.getManyAndCount();
    // Read the computed alias
    const raw = await queryBuilder.getRawMany();

    const data = withdraws.map((w, i) => ({
      ...w,
      // destination will be string | null
      destination: raw[i]?.destination ?? null,
    }));

    return {
      data,
      total,
    };
  }

  async getUserWithdraws(user, paginationDto: PaginationDto) {
    this.logger.debug({
      function: 'getUserWithdraws',
      user,
      paginationDto,
    });
    const { limit, offset } = paginationDto;
    const queryBuilder = this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .select(['withdraw', 'user.name', 'user.phone_number'])
      .where('withdraw.user_id = :userId', { userId: user.id })
      .skip(offset)
      .take(limit)
      .orderBy('withdraw.created_at', 'DESC');

    const [withdraws, total] = await queryBuilder.getManyAndCount();

    return {
      data: withdraws,
      total,
    };
  }

  async getAllWithdraws(paginationDto: PaginationDto) {
    this.logger.debug({
      function: 'getAllWithdraws',
      paginationDto,
    });
    const { limit, offset } = paginationDto;
    const queryBuilder = this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.user', 'user')
      .leftJoin('withdraw.cryptoAccount', 'cryptoAccount')
      .leftJoin('withdraw.bankAccount', 'bankAccount')
      .addSelect(['user.id', 'user.name', 'user.phone_number'])
      .addSelect(['cryptoAccount.wallet_address', 'bankAccount.iban'])
      // destination = first non-null of wallet_address or iban
      .addSelect(
        "COALESCE(cryptoAccount.wallet_address, bankAccount.iban)",
        'destination' 
      )
      .skip(offset)
      .take(limit)
      .orderBy('withdraw.created_at', 'DESC');

    // const [withdraws, total] = await queryBuilder.getManyAndCount();

    // Get entities + total
    const [withdraws, total] = await queryBuilder.getManyAndCount();
    // Read the computed alias
    const raw = await queryBuilder.getRawMany();

    const data = withdraws.map((w, i) => ({
      ...w,
      // destination will be string | null
      destination: raw[i]?.destination ?? null,
    }));

    return {
      data,
      total,
    };
  }

  async confirmWithdrawal(withdraw_id: number) {
    this.logger.debug({
      function: 'confirmWithdrawal',
      withdraw_id,
    });
    const withdraw = await this.withdrawRepository.findOne({
      where: {
        id: withdraw_id,
        status: WithdrawStatus.PENDING,
      },
    });
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found or already confirmed');
    }

    const userAccount = await this.accountService.findByUserId(
      withdraw.user_id,
    );
    const systemAccount = await this.accountService.getCashAccount();
    const withdrawFeeAccount =
      await this.accountService.getWithdrawFeeAccount();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const transaction = await this.transactionService.create(
        {
          status: TransactionStatus.POSTED,
          transaction_date: new Date().toISOString(),
          entries: [
            {
              account_id: userAccount.id,
              type: EntryType.DEBIT,
              amount: withdraw.amount + withdraw.fees_amount,
            },
            {
              account_id: systemAccount.id,
              type: EntryType.CREDIT,
              amount: withdraw.amount,
            },
            {
              account_id: withdrawFeeAccount.id,
              type: EntryType.CREDIT,
              amount: withdraw.fees_amount,
            },
          ],
        },
        queryRunner.manager,
      );
      const notification = await this.notificationService.createNotification(
        'Successful Withdrawal',
        `You withdrawn ${(
          (withdraw.amount + withdraw.fees_amount) /
          100
        ).toFixed(2)}$`,
        'سحب ناجح',
        `لقد قمت بسحب مبلغ ${(
          (withdraw.amount + withdraw.fees_amount) /
          100
        ).toFixed(2)}$ بنجاح`,
        withdraw.user_id,
        transaction.id,
      );
      withdraw.transaction_id = transaction.id;
      withdraw.status = WithdrawStatus.SUCCESS;
      await queryRunner.manager.save(withdraw);
      await queryRunner.manager.save(notification);
      await queryRunner.commitTransaction();
      return withdraw;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async declineWithdrawal(withdraw_id: number) {
    this.logger.debug({
      function: 'declineWithdrawal',
      withdraw_id,
    });
    const withdraw = await this.withdrawRepository.findOne({
      where: {
        id: withdraw_id,
        status: WithdrawStatus.PENDING,
      },
    });
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found or already confirmed');
    }
    withdraw.status = WithdrawStatus.FAILED;
    const notification = await this.notificationService.createNotification(
      'Failed Withdrawal',
      `You withdrawal of ${(
        (withdraw.amount + withdraw.fees_amount) /
        100
      ).toFixed(2)}$ was not successful`,
      'سحب فاشل',
      `تم رفض عملية سحب المبلغ ${(
        (withdraw.amount + withdraw.fees_amount) /
        100
      ).toFixed(2)}$`,
      withdraw.user_id,
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(withdraw);
      await queryRunner.manager.save(notification);
      await queryRunner.commitTransaction();
      return withdraw;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
