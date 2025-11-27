import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Deposit, DepositStatus } from '../entities/deposit.entity';
import { Transfer, TransferStatus } from '../entities/transfer.entity';
import {
  Withdraw,
  WithdrawStatus,
} from '../../withdrawal/entities/withdraw.entity';
import {
  TransactionCategory,
  TransactionHistoryFilterDto,
  TransactionHistoryResponseDto,
} from '../dto/transaction-history.dto';
import { Users } from '../entities/users.entity';
import {
  Donation,
  DonationStatus,
} from '../../campaigns/entities/donation.entity';
import { Transaction } from '../../double-entry-ledger/entities/transaction.entity';

@Injectable()
export class TransactionHistoryService {
  private readonly logger = new Logger(TransactionHistoryService.name);

  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(Withdraw)
    private readonly withdrawRepository: Repository<Withdraw>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getOneTransaction(
    userId: number,
    id: string,
  ): Promise<TransactionHistoryResponseDto> {
    this.logger.debug({
      function: 'getOneTransaction',
      userId,
      id,
    });

    // Find the transaction entity
    const transaction = await this.dataSource
      .getRepository(Transaction)
      .findOne({
        where: { id: +id },
        relations: ['entries'],
      });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Try to find the related entity in a single pass
    const [deposit, withdraw, transfer, donation] = await Promise.all([
      this.depositRepository.findOne({
        where: { transaction_id: transaction.id, user_id: userId },
        relations: ['transaction', 'transaction.entries'],
      }),
      this.withdrawRepository.findOne({
        where: { transaction_id: transaction.id, user_id: userId },
        relations: ['transaction', 'transaction.entries'],
      }),
      this.transferRepository.findOne({
        where: [
          { transaction_id: transaction.id, sender_user_id: userId },
          { transaction_id: transaction.id, receiver_user_id: userId },
        ],
        relations: ['transaction', 'transaction.entries', 'sender', 'receiver'],
      }),
      this.donationRepository.findOne({
        where: { transaction_id: transaction.id, user_id: userId },
        relations: ['transaction', 'campaign', 'transaction.entries'],
      }),
    ]);

    if (deposit) {
      return this.mapDepositsToResponse([deposit])[0];
    }
    if (withdraw) {
      return this.mapWithdrawalsToResponse([withdraw])[0];
    }
    if (transfer) {
      return this.mapTransfersToResponse(userId, [transfer])[0];
    }
    if (donation) {
      return this.mapDonationsToResponse([donation])[0];
    }

    throw new NotFoundException('Transaction not found for user');
  }

  async getTransactionHistory(
    userId: number,
    filterDto: TransactionHistoryFilterDto,
  ): Promise<TransactionHistoryResponseDto[]> {
    this.logger.debug({
      function: 'getTransactionHistory',
      userId,
      filterDto,
    });
 
    const { category, minAmount, maxAmount, fromDate, toDate } = filterDto;

    // Load the transactions based on the filter
    const [deposits, withdrawals, transfers, donations] = await Promise.all([
      category === TransactionCategory.ALL ||
      category === TransactionCategory.DEPOSIT
        ? this.getDeposits(userId, minAmount, maxAmount, fromDate, toDate)
        : [],
      category === TransactionCategory.ALL ||
      category === TransactionCategory.WITHDRAW
        ? this.getWithdrawals(userId, minAmount, maxAmount, fromDate, toDate)
        : [],
      category === TransactionCategory.ALL ||
      category === TransactionCategory.TRANSFER
        ? this.getTransfers(userId, minAmount, maxAmount, fromDate, toDate)
        : [],
      category === TransactionCategory.ALL ||
      category === TransactionCategory.DONATION
        ? this.getDonations(userId, minAmount, maxAmount, fromDate, toDate)
        : [],
    ]);

    // Combine all transactions
    const allTransactions = [
      ...this.mapDepositsToResponse(deposits),
      ...this.mapWithdrawalsToResponse(withdrawals),
      ...this.mapTransfersToResponse(userId, transfers),
      ...this.mapDonationsToResponse(donations),
    ];

    // Sort by date descending
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    return allTransactions;
    // Apply pagination
    // return allTransactions.slice(offset, offset + limit);
  }

  async getTransactionDetails(
    userId: number,
    id: number,
    category: TransactionCategory,
  ): Promise<any> {
    this.logger.debug({
      function: 'getTransactionDetails',
      userId,
      id,
      category,
    });

    switch (category) {
      case TransactionCategory.DEPOSIT:
        return this.getDepositDetails(userId, id);
      case TransactionCategory.WITHDRAW:
        return this.getWithdrawDetails(userId, id);
      case TransactionCategory.TRANSFER:
        return this.getTransferDetails(userId, id);
      default:
        throw new NotFoundException('Transaction not found');
    }
  }

  private async getDepositDetails(userId: number, id: number): Promise<any> {
    const deposit = await this.depositRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return {
      id: deposit.id,
      amount: deposit.amount,
      date: deposit.created_at,
      type: 'Deposit',
      description: 'Money added to your account',
      status: deposit.status,
      transaction_id: deposit.transaction_id,
      category: TransactionCategory.DEPOSIT,
      reference: `D-${deposit.id}`,
    };
  }

  private async getWithdrawDetails(userId: number, id: number): Promise<any> {
    const withdraw = await this.withdrawRepository.findOne({
      where: { id, user_id: userId } 
        // , status: WithdrawStatus.SUCCESS },
    });

    if (!withdraw) {
      throw new NotFoundException('Withdrawal not found');
    }

    return {
      id: withdraw.id,
      amount: -withdraw.amount,
      date: withdraw.created_at,
      type: 'Withdraw',
      description: `Withdrawal (${withdraw.type})`,
      status: withdraw.status,
      transaction_id: withdraw.transaction_id,
      category: TransactionCategory.WITHDRAW,
      method: withdraw.type,
      comment: withdraw.comment,
      reference: `W-${withdraw.id}`,
    };
  }

  private async getTransferDetails(userId: number, id: number): Promise<any> {
    const transfer = await this.transferRepository.findOne({
      where: [
        { id, sender_user_id: userId },
        { id, receiver_user_id: userId },
        // by RSR { status: TransferStatus.SUCCESS },
      ],
      relations: ['sender', 'receiver'],
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    const isSender = transfer.sender_user_id === userId;
    return {
      id: transfer.id,
      amount: isSender ? -transfer.amount : transfer.amount,
      date: transfer.created_at,
      type: isSender ? 'Sent' : 'Received',
      description: isSender ? 'Money sent' : 'Money received',
      status: transfer.status,
      transaction_id: transfer.transaction_id,
      category: TransactionCategory.TRANSFER,
      sourceName: transfer.sender?.name,
      targetName: transfer.receiver?.name,
      targetId: transfer.receiver_user_id,
      reference: `T-${transfer.id}`,
    };
  }

  private async getDeposits(
    userId: number,
    minAmount?: number,
    maxAmount?: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Deposit[]> {
    const queryBuilder = this.depositRepository
      .createQueryBuilder('deposit')
      .leftJoinAndSelect('deposit.transaction', 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .where('deposit.user_id = :userId', { userId });
      // .andWhere('deposit.status = :status', { status: DepositStatus.SUCCESS }); 

    if (minAmount) {
      queryBuilder.andWhere('deposit.amount >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('deposit.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate) {
      queryBuilder.andWhere('deposit.created_at >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('deposit.created_at <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  private async getWithdrawals(
    userId: number,
    minAmount?: number,
    maxAmount?: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Withdraw[]> {
    const queryBuilder = this.withdrawRepository
      .createQueryBuilder('withdraw')
      .leftJoinAndSelect('withdraw.transaction', 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .where('withdraw.user_id = :userId', { userId });
      //by RSR .andWhere('withdraw.status = :status', {
      //   status: WithdrawStatus.SUCCESS,
      // });

    if (minAmount) {
      queryBuilder.andWhere('withdraw.amount >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('withdraw.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate) {
      queryBuilder.andWhere('withdraw.created_at >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('withdraw.created_at <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  private async getTransfers(
    userId: number,
    minAmount?: number,
    maxAmount?: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Transfer[]> {
    const queryBuilder = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.transaction', 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .leftJoinAndSelect('transfer.sender', 'sender')
      .leftJoinAndSelect('transfer.receiver', 'receiver')
      .where(
        'transfer.sender_user_id = :userId OR transfer.receiver_user_id = :userId',
        { userId },
      );

    if (minAmount) {
      queryBuilder.andWhere('transfer.amount >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('transfer.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate) {
      queryBuilder.andWhere('transfer.created_at >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('transfer.created_at <= :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  private async getDonations(
    userId: number,
    minAmount?: number,
    maxAmount?: number,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Donation[]> {
    const queryBuilder = this.donationRepository
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.transaction', 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .leftJoinAndSelect('donation.campaign', 'campaign')
      .where('donation.user_id = :userId', { userId });
      //by RSR .andWhere('donation.status = :status', {
      //   status: DonationStatus.SUCCESS,
      // });
    if (minAmount) {
      queryBuilder.andWhere('donation.amount >= :minAmount', { minAmount });
    }
    if (maxAmount) {
      queryBuilder.andWhere('donation.amount <= :maxAmount', { maxAmount });
    }
    if (fromDate) {
      queryBuilder.andWhere('donation.created_at >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('donation.created_at <= :toDate', { toDate });
    }
    return queryBuilder.getMany();
  }
 
  private mapDepositsToResponse(
    deposits: Deposit[],
  ): TransactionHistoryResponseDto[] {
    return deposits.map((deposit) => ({
      user_id: deposit.user_id,
      id: deposit.id,
      amount: deposit.amount,
      date: deposit.created_at,
      type: 'Deposit',
      status: deposit.status, // by RSR
      description: 'Money added to your account',
      category: TransactionCategory.DEPOSIT,
      reference: `D-${deposit.id}`,
      transaction: deposit.transaction,
    }));
  }

  private mapWithdrawalsToResponse(
    withdrawals: Withdraw[],
  ): TransactionHistoryResponseDto[] {
    return withdrawals.map((withdraw) => ({
      user_id: withdraw.user_id,
      id: withdraw.id,
      amount: -withdraw.amount, // Negative for withdrawal
      date: withdraw.created_at,
      type: 'Withdraw',
      status: withdraw.status, // by RSR
      description: `Withdrawal (${withdraw.type})`,
      category: TransactionCategory.WITHDRAW,
      reference: `W-${withdraw.id}`,
      comment: withdraw.comment, // by RSR
      transaction: withdraw.transaction,
    }));
  }

  private mapTransfersToResponse(
    userId: number,
    transfers: Transfer[],
  ): TransactionHistoryResponseDto[] {
    return transfers.map((transfer) => {
      const isSender = transfer.sender_user_id === userId;
      return {
        id: transfer.id,
        amount: isSender ? -transfer.amount : transfer.amount, // Negative if sending
        date: transfer.created_at,
        type: isSender ? 'Sent' : 'Received',
        status: transfer.status, // by RSR
        description: isSender ? 'Money sent' : 'Money received',
        category: TransactionCategory.TRANSFER,
        sourceName: transfer.sender?.name,
        targetName: transfer.receiver?.name,
        sender_user_id: transfer.sender_user_id,
        receiver_user_id: transfer.receiver_user_id,
        reference: `T-${transfer.id}`,
        comment: transfer.comment, // by RSR
        transaction: transfer.transaction,
      };
    });
  }

  private mapDonationsToResponse(
    donations: Donation[],
  ): TransactionHistoryResponseDto[] {
    return donations.map((donation) => ({
      user_id: donation.user_id,
      id: donation.id,
      amount: -donation.amount, // Negative because it's an outgoing transaction
      date: donation.created_at,
      type: 'Donation',
      status: donation.status, // by RSR
      description: `Donation to campaign: ${
        donation.campaign?.title || donation.campaign_id
      }`,
      category: TransactionCategory.DONATION,
      reference: `DN-${donation.id}`,
      //comment: donation.comment, // by RSR
      campaign_id: donation.campaign_id,
      campaign_name: donation.campaign?.title,
      transaction: donation.transaction,
    }));
  }
}
