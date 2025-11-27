import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BeneficiaryCampaigns } from '../entities/beneficiary-campaigns.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBeneficiaryCampaignDto } from '../dto/create-beneficiary-campaigns.dto';
import { CampaignsService } from './campaigns.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { DeleteBeneficiaryDto } from '../dto/delete-beneficiary.dto';
import { AddBeneficiaryCampaignDto } from '../dto/add-beneficiaries-campaign.dto';
import { In } from 'typeorm';
import { BeneficiaryService } from 'src/modules/users/services/beneficiary.service';
@Injectable()
export class BeneficiaryCampaignsService {
  private logger = new Logger(BeneficiaryCampaignsService.name);
  constructor(
    @InjectRepository(BeneficiaryCampaigns)
    private readonly beneficiaryCampaignsRepository: Repository<BeneficiaryCampaigns>,
    private readonly campaignsService: CampaignsService,
    private readonly usersService: UsersService,
    private readonly beneficiaryService: BeneficiaryService,
  ) {}

  async addBeneficiariesToCampaign(
    user: IUserIdentity,
    addBeneficiaryCampaignDto: AddBeneficiaryCampaignDto,
  ) {
    this.logger.debug({
      function: 'addBeneficiariesToCampaign',
      user,
      addBeneficiaryCampaignDto,
    });

    const campaign = await this.campaignsService.findOne(
      addBeneficiaryCampaignDto.campaign_id,
    );
    if (!campaign) {
      throw new NotFoundException('Campaign Not Found!');
    }

    // Get existing beneficiaries to avoid duplicates
    const existingBeneficiaries =
      await this.beneficiaryCampaignsRepository.find({
        where: {
          campaign_id: campaign.id,
          user_id: In(addBeneficiaryCampaignDto.user_ids),
        },
      });

    const existingUserIds = existingBeneficiaries.map((bc) => bc.user_id);
    const newUserIds = addBeneficiaryCampaignDto.user_ids.filter(
      (userId) => !existingUserIds.includes(userId),
    );

    if (newUserIds.length > 0) {
      const beneficiaryCampaigns = newUserIds.map((userId) =>
        this.beneficiaryCampaignsRepository.create({
          campaign,
          user_id: userId,
          created_by: user.id,
        }),
      );

      await this.beneficiaryCampaignsRepository.save(beneficiaryCampaigns);
      await this.campaignsService.updateCampaignBeneficiaryCount(
        campaign.id,
        await this.beneficiaryCampaignsRepository.count({
          where: { campaign_id: campaign.id, deleted_at: null },
        }),
      );
    }

    return {
      message: 'Beneficiaries added successfully',
      added_count: newUserIds.length,
      skipped_count: existingUserIds.length,
    };
  }

  async createOne(
    loggedInUser,
    createBeneficiaryCampaignDto: CreateBeneficiaryCampaignDto,
  ) {
    this.logger.debug({
      function: 'createOne',
      loggedInUser,
      createBeneficiaryCampaignDto,
    });

    const campaign = await this.campaignsService.findOrganizerCampaign(
      createBeneficiaryCampaignDto.campaign_id,
      loggedInUser.id,
    );
    if (!campaign) {
      throw new NotFoundException('Campaign Not Found!');
    }

    const user = await this.beneficiaryService.createBeneficiary(
      createBeneficiaryCampaignDto.createBeneficiaryDto,
      loggedInUser.id,
    );

    let beneficiaryCampaigns =
      await this.beneficiaryCampaignsRepository.findOneBy({
        user_id: user.id,
      });

    if (!beneficiaryCampaigns) {
      beneficiaryCampaigns = this.beneficiaryCampaignsRepository.create({
        campaign,
        user,
        created_by: loggedInUser.id,
      });
    }

    await this.beneficiaryCampaignsRepository.save(beneficiaryCampaigns);

    await this.campaignsService.updateCampaignBeneficiaryCount(
      campaign.id,
      await this.beneficiaryCampaignsRepository.count({
        where: { campaign_id: campaign.id, deleted_at: null },
      }),
    );
  }

  excelDateToJSDate(serial: number): string {
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }

  async createManyFromExcel(
    excel_data: any[],
    campaign_id: number,
    loggedInUser: any,
  ) {
    this.logger.debug({
      function: 'createManyFromExcel',
      loggedInUser,
      campaign_id,
      excel_data,
    });

    const beneficiaryCampaignsToInsert = [];

    for (const beneficiary of excel_data) {
      if (typeof beneficiary.birth_date === 'number') {
        beneficiary.birth_date = this.excelDateToJSDate(beneficiary.birth_date);
      }
      const campaign = await this.campaignsService.findOrganizerCampaign(
        campaign_id,
        loggedInUser.id,
      );
      if (!campaign) {
        throw new NotFoundException(
          `Campaign with ID ${campaign_id} not found!`,
        );
      }

      const user = await this.beneficiaryService.createBeneficiary(
        beneficiary,
        loggedInUser.id,
      );

      const existingBeneficiaryCampaign =
        await this.beneficiaryCampaignsRepository.findOneBy({
          user_id: user.id,
          campaign_id: campaign_id,
        });

      if (!existingBeneficiaryCampaign) {
        beneficiaryCampaignsToInsert.push(
          this.beneficiaryCampaignsRepository.create({
            campaign,
            user,
            created_by: loggedInUser.id,
          }),
        );
      }
    }

    if (beneficiaryCampaignsToInsert.length > 0) {
      await this.beneficiaryCampaignsRepository.save(
        beneficiaryCampaignsToInsert,
      );
    }

    await this.campaignsService.updateCampaignBeneficiaryCount(
      campaign_id,
      await this.beneficiaryCampaignsRepository.count({
        where: { campaign_id: campaign_id, deleted_at: null },
      }),
    );

    return {
      message: 'Batch creation completed',
      created_count: beneficiaryCampaignsToInsert.length,
      total_requested: excel_data.length,
    };
  }

  async getBeneficiaries(user: IUserIdentity, paginationDto: PaginationDto) {
    this.logger.debug({
      function: 'getBeneficiaries',
      user,
      paginationDto,
    });
    const { limit, offset } = paginationDto;
    const queryBuilder = this.beneficiaryCampaignsRepository
      .createQueryBuilder('bc')
      .leftJoinAndSelect('bc.user', 'user')
      .leftJoin('bc.campaign', 'campaign')
      .skip(offset)
      .take(limit);

    const [data] = await queryBuilder.getManyAndCount();
    return {
      data: data.map((bc) => bc.user),
    };
  }

  async getCampaignBeneficiaries(
    campaignId: number,
    user: IUserIdentity,
    paginationDto: PaginationDto,
  ) {
    this.logger.debug({
      function: 'getCampaignBeneficiaries',
      user,
      campaignId,
      paginationDto,
    });
    const { limit, offset } = paginationDto;
    const queryBuilder = this.beneficiaryCampaignsRepository
      .createQueryBuilder('bc')
      .leftJoinAndSelect('bc.user', 'user')
      .leftJoin('bc.campaign', 'campaign')
      .where('campaign.id = :campaignId', { campaignId })
      // .andWhere('campaign.organizer_id = :user_id', { user_id })
      .skip(offset)
      .take(limit);

    const [results] = await queryBuilder.getManyAndCount();
    return {
      data: results.map((bc) => bc.user),
    };
  }

  async removeBeneficiary(deleteBeneficiary: DeleteBeneficiaryDto, user) {
    this.logger.debug({
      function: 'removeBeneficiary',
      deleteBeneficiary,
      user,
    });
    const records = await this.beneficiaryCampaignsRepository.find({
      where: {
        campaign_id: deleteBeneficiary.campaign_id,
        user_id: In(deleteBeneficiary.beneficiary_ids),
      },
    });

    if (records.length === 0) {
      throw new NotFoundException('No beneficiaries found');
    }

    // Update deleted_by for all records
    records.forEach((record) => {
      record.deleted_by = user.id;
    });

    // Save the updated records
    await this.beneficiaryCampaignsRepository.save(records);

    // Soft delete all records
    await this.beneficiaryCampaignsRepository.softDelete(
      records.map((record) => record.id),
    );

    await this.campaignsService.updateCampaignBeneficiaryCount(
      deleteBeneficiary.campaign_id,
      await this.beneficiaryCampaignsRepository.count({
        where: { campaign_id: deleteBeneficiary.campaign_id, deleted_at: null },
      }),
    );
    this.logger.log({
      function: 'removeBeneficiary',
      message: `Removed ${records.length} beneficiaries from campaign ${deleteBeneficiary.campaign_id}`,
    });

    return {
      message: 'Beneficiaries removed successfully',
      removed_count: records.length,
    };
  }
}
