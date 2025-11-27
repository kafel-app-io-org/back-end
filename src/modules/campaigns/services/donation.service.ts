import { DataSource, Repository } from 'typeorm';
import { Donation, DonationStatus } from '../entities/donation.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { CreateDonationDto } from '../dto/create-donation.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { TransactionStatus } from '../../double-entry-ledger/entities/transaction.entity';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { Campaigns } from '../entities/campaign.entity';
import { BeneficiaryDistributionService } from './beneficiary-distribution.service';
import { DonationFilterDto } from '../dto/donation-filter.dto';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly beneficiaryDistributionService: BeneficiaryDistributionService,
    private readonly notificationService: NotificationsService,
  ) {}

  async createDonation(
    user: IUserIdentity,
    createDonationDto: CreateDonationDto,
  ) {
    this.logger.debug({
      function: 'createDonation',
      user,
      createDonationDto,
    });

    const userAccount = await this.accountService.findByUserId(user.id);

    if (userAccount.available_balance < createDonationDto.amount) {
      throw new BadRequestException(
        'Insufficient balance to complete the donation',
      );
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const campaign = await queryRunner.manager.findOne(Campaigns, {
        where: {
          id: createDonationDto.campaign_id,
        },
        relations: {
          account: true,
        },
      });

      const savedTransaction = await this.transactionService.create(
        {
          transaction_date: new Date().toISOString(),
          status: TransactionStatus.POSTED,
          entries: [
            {
              account_id: userAccount.id,
              type: EntryType.DEBIT,
              amount: createDonationDto.amount,
            },
            {
              account_id: campaign.account.id,
              type: EntryType.CREDIT,
              amount: createDonationDto.amount,
            },
          ],
        },
        queryRunner.manager,
      );
      const donation = this.donationRepository.create({
        status: DonationStatus.SUCCESS,
        user_id: user.id,
        amount: createDonationDto.amount,
        campaign_id: createDonationDto.campaign_id,
        transaction_id: savedTransaction.id,
      });
      const notification = await this.notificationService.createNotification(
        'Successful Donation',
        `You donated ${(donation.amount / 100).toFixed(2)}$ to campaign ${
          campaign.title
        }`,
        'تبرع ناجح',
        `لقد قمت بالتبرع بمبلغ ${(donation.amount / 100).toFixed(2)}$ للحملة ${
          campaign.title
        }`,
        user.id,
        savedTransaction.id,
      );
      await queryRunner.manager.save(donation);
      await queryRunner.manager.save(notification);

      campaign.total_collected += createDonationDto.amount;
      await queryRunner.manager
        .createQueryBuilder()
        .update(Campaigns)
        .set({ total_collected: campaign.total_collected })
        .where('id = :id', { id: campaign.id })
        .execute();
      await queryRunner.commitTransaction();
      return donation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getDonations(loggedInUser, filterDto: DonationFilterDto) {
    this.logger.debug({
      function: 'getDonations',
      loggedInUser,
      filterDto,
    });

    const {
      limit,
      offset,
      country,
      campaign,
      campaignId,
      organizer,
      organizer_id,
      beneficiaryType,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
    } = filterDto;

    // Build query with filters
    const queryBuilder = this.donationRepository
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.campaign', 'campaign')
      .leftJoinAndSelect('campaign.organizer', 'organizer')
      .leftJoinAndSelect('campaign.targetBeneficiaries', 'targetBeneficiaries')
      .where('donation.user_id = :userId', { userId: loggedInUser.id });

    // Apply filters
    if (country) {
      queryBuilder.andWhere('campaign.country IN (:...country)', { country });
    }

    // Prioritize campaign ID over campaign name if both are provided
    if (campaignId) {
      queryBuilder.andWhere('campaign.id IN (:...campaignId)', { campaignId });
    } else if (campaign) {
      // Legacy support for campaign name
      queryBuilder.andWhere('campaign.title LIKE :campaign', {
        campaign: `%${campaign}%`,
      });
    }

    // Prioritize organizer_id over organizer name if both are provided
    if (organizer_id) {
      queryBuilder.andWhere('campaign.organizer_id IN (:...organizer_id)', {
        organizer_id,
      });
    } else if (organizer) {
      // Legacy support for organizer name
      queryBuilder.andWhere('organizer.name LIKE :organizer', {
        organizer: `%${organizer}%`,
      });
    }

    if (beneficiaryType) {
      queryBuilder.andWhere('targetBeneficiaries.id IN (:...beneficiaryType)', {
        beneficiaryType,
      });
    }

    if (minAmount && maxAmount) {
      queryBuilder.andWhere(
        'donation.amount BETWEEN :minAmount AND :maxAmount',
        {
          minAmount,
          maxAmount,
        },
      );
    } else if (minAmount) {
      queryBuilder.andWhere('donation.amount >= :minAmount', { minAmount });
    } else if (maxAmount) {
      queryBuilder.andWhere('donation.amount <= :maxAmount', { maxAmount });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere(
        'DATE(donation.created_at) BETWEEN DATE(:fromDate) AND DATE(:toDate)',
        {
          fromDate,
          toDate,
        },
      );
    } else if (fromDate) {
      queryBuilder.andWhere('DATE(donation.created_at) >= DATE(:fromDate)', {
        fromDate,
      });
    } else if (toDate) {
      queryBuilder.andWhere('DATE(donation.created_at) <= DATE(:toDate)', {
        toDate,
      });
    }

    // Apply pagination
    queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('donation.created_at', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Get donation details with distribution information about the beneficiaries
   * who received funds from this donation
   */
  async getDonationWithDistributions(donationId: number) {
    const donation = await this.donationRepository.findOne({
      where: {
        id: donationId,
      },
      relations: ['campaign'],
    });

    if (!donation) {
      throw new BadRequestException(
        `Donation with ID ${donationId} not found or doesn't belong to user`,
      );
    }

    const distributions =
      await this.beneficiaryDistributionService.getDistributionsByDonation(
        donationId,
      );

    // Calculate total amount distributed and number of beneficiaries
    const totalDistributed = distributions.reduce(
      (sum, dist) => sum + dist.amount,
      0,
    );
    const uniqueBeneficiaries = new Set(
      distributions.map((dist) => dist.beneficiary?.id),
    ).size;

    return {
      ...donation,
      distributions,
      summary: {
        total_distributed: totalDistributed,
        total_donation: donation.amount,
        remaining_to_distribute: donation.amount - totalDistributed,
        beneficiary_count: uniqueBeneficiaries,
        campaign_name: donation.campaign?.title || 'Unknown Campaign',
        distribution_status:
          totalDistributed >= donation.amount
            ? 'Fully Distributed'
            : 'Partially Distributed',
      },
    };
  }
}
