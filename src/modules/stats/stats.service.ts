import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { Campaign } from './entities/campaign.entity';
import { Donation } from './entities/donation.entity';
import { Withdraw } from './entities/withdraw.entity';
import { Deposit } from './entities/deposit.entity';
import { Transfer } from './entities/transfer.entity';

import { StatsOverviewDto } from './dto/overview.dto';
import { DonationsByCountryItemDto } from './dto/donations-country.dto';
import { TransactionsByTypeItemDto } from './dto/transactions-type.dto';
import { DailyDonationItemDto } from './dto/daily-donations.dto';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface CountAmount {
  count: number;
  amount: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    @InjectRepository(Withdraw)
    private readonly withdrawRepo: Repository<Withdraw>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Transfer)
    private readonly transferRepo: Repository<Transfer>,
  ) {}

  // ------------- helpers -------------

  private async aggregateCountAndAmount<T>(
    repo: Repository<T>,
    alias: string,
    range?: DateRange,
  ): Promise<CountAmount> {
    const from = range?.from;
    const to = range?.to;

    const qb = repo
      .createQueryBuilder(alias)
      .select('COUNT(*)', 'count')
      .addSelect(`COALESCE(SUM(${alias}.amount), 0)`, 'amount');

    if (from) {
      qb.andWhere(`${alias}.createdAt >= :from`, { from });
    }
    if (to) {
      qb.andWhere(`${alias}.createdAt <= :to`, { to });
    }

    const raw = await qb.getRawOne<{ count: string; amount: string }>();

    return {
      count: Number(raw?.count || 0),
      amount: Number(raw?.amount || 0),
    };
  }

  // ------------- OVERVIEW CARDS -------------

  async getOverview(range?: DateRange): Promise<StatsOverviewDto> {
    const [totalUsers, totalCampaigns, donations, withdraws, deposits, transfers] =
      await Promise.all([
        this.userRepo.count(),
        this.campaignRepo.count(),
        this.aggregateCountAndAmount(this.donationRepo, 'd', range),
        this.aggregateCountAndAmount(this.withdrawRepo, 'w', range),
        this.aggregateCountAndAmount(this.depositRepo, 'dep', range),
        this.aggregateCountAndAmount(this.transferRepo, 't', range),
      ]);

    const totalTransactionsCount =
      donations.count + withdraws.count + deposits.count + transfers.count;

    const totalDonationsCount = donations.count;
    const totalWithdrawalsCount = withdraws.count;
    const totalDonationsAmount = donations.amount+1;
    const totalWithdrawalsAmount = withdraws.amount;
    const totalDepositsCount = deposits.count;
    const totalDepositsAmount = deposits.amount;
    const totalTransfersCount = transfers.count;
    const totalTransfersAmount = transfers.amount;

    const totalCollectedFees = 0; // TODO: wire to your real fees later

    return {
      totalUsers,
      totalCampaigns,
      totalTransactionsCount,
      totalDonationsCount,
      totalWithdrawalsCount,
      totalDonationsAmount,
      totalWithdrawalsAmount,
      totalCollectedFees,
      totalDepositsCount,
      totalDepositsAmount,
      totalTransfersCount,
      totalTransfersAmount
    };
  }

  // ------------- TRANSACTION TYPE CHART -------------

  async getTransactionsByType(
    range?: DateRange,
  ): Promise<TransactionsByTypeItemDto[]> {
    const [donations, withdraws, deposits, transfers] = await Promise.all([
      this.aggregateCountAndAmount(this.donationRepo, 'd', range),
      this.aggregateCountAndAmount(this.withdrawRepo, 'w', range),
      this.aggregateCountAndAmount(this.depositRepo, 'dep', range),
      this.aggregateCountAndAmount(this.transferRepo, 't', range),
    ]);

    const items: TransactionsByTypeItemDto[] = [
      { type: 'donation', count: donations.count, amount: donations.amount, percentage: 0 },
      { type: 'withdraw', count: withdraws.count, amount: withdraws.amount, percentage: 0 },
      { type: 'deposit', count: deposits.count, amount: deposits.amount, percentage: 0 },
      { type: 'transfer', count: transfers.count, amount: transfers.amount, percentage: 0 },
    ];

    const totalCount = items.reduce((s, i) => s + i.count, 0) || 1;

    return items.map((i) => ({
      ...i,
      percentage: Math.round((i.count / totalCount) * 1000) / 10, // one decimal
    }));
  }

  // ------------- DAILY DONATIONS CHART -------------

  async getDailyDonations(range?: DateRange): Promise<DailyDonationItemDto[]> {
    const from = range?.from;
    const to = range?.to;

    const qb = this.donationRepo
      .createQueryBuilder('d')
      .select("DATE(d.createdAt)", 'date')
      .addSelect('COALESCE(SUM(d.amount), 0)', 'amount');

    if (from) qb.andWhere('d.createdAt >= :from', { from });
    if (to) qb.andWhere('d.createdAt <= :to', { to });

    qb.groupBy('DATE(d.createdAt)').orderBy('DATE(d.createdAt)', 'ASC');

    const raw = await qb.getRawMany<{ date: string; amount: string }>();

    return raw.map((r) => ({
      date: r.date,
      amount: Number(r.amount || 0),
    }));
  }

  // ------------- DONATIONS BY COUNTRY (placeholder) -------------

  /**
   * For now we just return a single total item, because we need to know
   * which table/column stores the country (user? beneficiary? location?).
   * You can extend this once you confirm the relationships.
   */
  async getDonationsByCountry(
    range?: DateRange,
  ): Promise<DonationsByCountryItemDto[]> {
    const donations = await this.aggregateCountAndAmount(
      this.donationRepo,
      'd',
      range,
    );

    return [
      {
        countryCode: 'ALL',
        amount: donations.amount,
        percentage: 100,
      },
    ];
  }
}
