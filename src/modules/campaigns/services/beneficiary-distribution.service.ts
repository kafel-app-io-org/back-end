import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import { BeneficiaryDistribution } from '../entities/beneficiary-distribution.entity';
import { BeneficiaryCampaigns } from '../entities/beneficiary-campaigns.entity';
import { Donation } from '../entities/donation.entity';
import { Campaigns } from '../entities/campaign.entity';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { TransactionStatus } from '../../double-entry-ledger/entities/transaction.entity';

@Injectable()
export class BeneficiaryDistributionService {
  private readonly logger = new Logger(BeneficiaryDistributionService.name);

  constructor(
    @InjectRepository(BeneficiaryDistribution)
    private readonly distributionRepository: Repository<BeneficiaryDistribution>,
    @InjectRepository(BeneficiaryCampaigns)
    private readonly beneficiaryCampaignsRepository: Repository<BeneficiaryCampaigns>,
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    @InjectRepository(Campaigns)
    private readonly campaignsRepository: Repository<Campaigns>,
    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all distributions for a donation with detailed beneficiary information
   */
  async getDistributionsByDonation(donationId: number): Promise<any[]> {
    // where amount is not 0
    const distributions = await this.distributionRepository.find({
      where: { donation_id: donationId, amount: MoreThan(0) },
      relations: [
        'beneficiaryCampaign',
        'beneficiaryCampaign.user',
        'beneficiaryCampaign.campaign',
      ],
    });

    const merged: Record<string, any> = {};

    distributions.forEach((distribution) => {
      const { beneficiaryCampaign } = distribution;
      const beneficiaryId = beneficiaryCampaign.user?.id;
      const date = distribution.created_at
        ? distribution.created_at.toISOString().slice(0, 10)
        : 'unknown';

      const key = `${beneficiaryId}_${date}`;

      if (!merged[key]) {
        merged[key] = {
          ...distribution,
          amount: 0,
          beneficiary: {
            id: beneficiaryId,
            name: beneficiaryCampaign.user?.name || 'Unknown',
            email: beneficiaryCampaign.user?.email,
            city: beneficiaryCampaign.user.city,
            country: beneficiaryCampaign.user.country,
            image: beneficiaryCampaign.user.image,
            distributed_amount: beneficiaryCampaign.distributed_amount,
            campaign_name: beneficiaryCampaign.campaign?.title,
          },
          date,
        };
      }

      merged[key].amount += distribution.amount;
    });

    return Object.values(merged);
  }

  /**
   * Get all distributions for a beneficiary
   */
  async getDistributionsByBeneficiary(beneficiaryId: number) {
    const beneficiaryCampaigns = await this.beneficiaryCampaignsRepository.find(
      {
        where: { user_id: beneficiaryId },
      },
    );

    const bcIds = beneficiaryCampaigns.map((bc) => bc.id);

    // If there are no beneficiary campaigns, return empty array
    if (bcIds.length === 0) {
      return [];
    }

    return this.distributionRepository.find({
      where: {
        beneficiary_campaign_id: In(bcIds),
      },
      relations: [
        'donation',
        'beneficiaryCampaign',
        'beneficiaryCampaign.campaign',
      ],
    });
  }

  /**
   * Distribute all available funds for a campaign to its beneficiaries
   */
  async distributeCampaignFunds(campaignId: number) {
    this.logger.debug({
      function: 'distributeCampaignFunds',
      campaignId,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get campaign with account and beneficiaries
      const campaign = await this.campaignsRepository.findOne({
        where: { id: campaignId },
        relations: [
          'account',
          'beneficiaryCampaigns',
          'beneficiaryCampaigns.user',
        ],
      });

      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
      }

      // Get single target amount
      const singleTarget = campaign.single_target * 100;

      const eligibleBeneficiaries = campaign.beneficiaryCampaigns;

      if (campaign.num_beneficiaries !== eligibleBeneficiaries.length) {
        this.logger.warn(
          `Campaign ${campaignId} has ${eligibleBeneficiaries.length} beneficiaries, expected ${campaign.num_beneficiaries}`,
        );
        campaign.num_beneficiaries = eligibleBeneficiaries.length;
        await queryRunner.manager.save(campaign);
      }

      if (eligibleBeneficiaries.length === 0) {
        throw new BadRequestException(
          'No eligible beneficiaries found or all beneficiaries have reached their target amount',
        );
      }

      // Check available balance in campaign account
      const availableBalance = campaign.account.available_balance;
      if (
        availableBalance <=
        campaign.single_target * 100 * campaign.beneficiaryCampaigns.length
      ) {
        throw new BadRequestException(
          'Not Enough funds available for distribution',
        );
      }

      // Get all successful donations for this campaign that haven't been fully distributed
      const donations = await this.donationRepository.find({
        where: {
          campaign_id: campaignId,
          status: 'success',
        },
        relations: ['distributions'],
        order: { created_at: 'ASC' },
      });

      if (donations.length === 0) {
        throw new BadRequestException('No donations found for this campaign');
      }

      // Calculate how much of each donation has already been distributed
      const donationsWithRemainingAmounts = donations
        .map((donation) => {
          const distributedAmount = donation.distributions.reduce(
            (sum, dist) => sum + dist.amount,
            0,
          );
          return {
            donation,
            remainingAmount: donation.amount - distributedAmount,
          };
        })
        .filter((d) => d.remainingAmount > 0); // Only include donations with remaining amounts

      if (donationsWithRemainingAmounts.length === 0) {
        return { message: 'All donations have been fully distributed' };
      }

      let remainingBalance = availableBalance;
      const distributions = [];

      // Distribute funds to eligible beneficiaries
      for (const beneficiaryCampaign of eligibleBeneficiaries) {
        if (remainingBalance <= 0) break;

        const userAccount = await this.accountService.findByUserId(
          beneficiaryCampaign.user_id,
        );

        if (!userAccount) {
          this.logger.error(
            `No account found for user ${beneficiaryCampaign.user_id}`,
          );
          throw new NotFoundException(
            `No account found for user ${beneficiaryCampaign.user_id}`,
          );
        }

        // Calculate amount to distribute to this beneficiary
        const amountNeeded = singleTarget;
        const amountToDistribute = Math.min(amountNeeded, remainingBalance);

        if (amountToDistribute <= 0) continue;

        // Create transaction from campaign account to beneficiary account
        const transaction = await this.transactionService.create(
          {
            transaction_date: new Date().toISOString(),
            status: TransactionStatus.POSTED,
            description: `Distribution from campaign ${campaign.id} to beneficiary ${beneficiaryCampaign.user_id}`,
            entries: [
              {
                account_id: campaign.account.id,
                type: EntryType.DEBIT,
                amount: amountToDistribute,
              },
              {
                account_id: userAccount.id,
                type: EntryType.CREDIT,
                amount: amountToDistribute,
              },
            ],
          },
          queryRunner.manager,
        );

        // Update beneficiary distributed amount
        beneficiaryCampaign.distributed_amount += amountToDistribute;
        await queryRunner.manager.save(beneficiaryCampaign);

        // Create distribution records for each donation that contributes to this distribution
        let amountLeftToDistribute = amountToDistribute;

        for (const donationWithRemaining of donationsWithRemainingAmounts) {
          if (amountLeftToDistribute <= 0) break;

          // Calculate how much to take from this donation
          const amountFromDonation = Math.min(
            donationWithRemaining.remainingAmount,
            amountLeftToDistribute,
          );

          // Create distribution record connected to this specific donation
          const distribution = this.distributionRepository.create({
            beneficiary_campaign_id: beneficiaryCampaign.id,
            beneficiary_user_id: beneficiaryCampaign.user_id,
            campaign_id: beneficiaryCampaign.campaign_id,
            donation_id: donationWithRemaining.donation.id,
            amount: amountFromDonation,
            status: 'completed',
            transaction_id: transaction.id.toString(),
          });

          // Save distribution and add to results
          distributions.push(await queryRunner.manager.save(distribution));

          // Update remaining amounts
          donationWithRemaining.remainingAmount -= amountFromDonation;
          amountLeftToDistribute -= amountFromDonation;
        }

        remainingBalance -= amountToDistribute;
      }

      await queryRunner.commitTransaction();

      return {
        message: `Distributed ${availableBalance - remainingBalance} funds to ${
          eligibleBeneficiaries.length
        } beneficiaries`,
        distributions,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
