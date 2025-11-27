import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Campaigns } from '../entities/campaign.entity';
import { DataSource, Repository } from 'typeorm';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import {
  AccountType,
  NormalBalanceType,
} from '../../double-entry-ledger/entities/account.entity';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { Role } from '../../../common/enum/role.enum';
import { CampaignFilterDto } from '../dto/campaign-filter.dto';
import { CampaignStatus } from '../../../common/enum/campaign-status.enum';
import { StoreImagesService } from 'src/modules/storage/services/store-images.service';
import { CampaignImages } from '../entities/campaign-images.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class CampaignsService {
  private logger = new Logger(CampaignsService.name);
  constructor(
    @InjectRepository(Campaigns)
    private readonly campaignRepository: Repository<Campaigns>,
    @InjectRepository(CampaignImages)
    private readonly campaignImagesRepository: Repository<CampaignImages>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly storeImagesService: StoreImagesService,
    private readonly accountService: AccountService,
  ) {}

  async updateCampaignBeneficiaryCount(
    campaignId: number,
    numberOfBeneficiaries: number,
  ): Promise<void> {
    this.logger.debug({
      function: 'updateCampaignBeneficiaryCount',
      campaignId,
      numberOfBeneficiaries,
    });
    const campaign = await this.campaignRepository.findOneBy({
      id: campaignId,
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    campaign.num_beneficiaries = numberOfBeneficiaries;
    await this.campaignRepository.save(campaign);
    this.logger.log(
      `Updated number of beneficiaries for campaign ${campaignId} to ${numberOfBeneficiaries}`,
    );
  }

  async create(
    user: IUserIdentity,
    createCampaignDto: CreateCampaignDto,
    imageFile?: Express.Multer.File,
  ): Promise<Campaigns> {
    this.logger.debug({
      function: 'createCampaign',
      user,
      createCampaignDto,
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (user.role === Role.ADMIN && !createCampaignDto.organizer_id) {
      createCampaignDto.organizer_id = user.id;
    }

    try {
      let imagePath: string | undefined;

      if (imageFile) {
        imagePath = await this.storeImagesService.uploadImage(imageFile);
      }

      const campaign = this.campaignRepository.create({
        ...createCampaignDto,
        image: imagePath,
      });
      await queryRunner.manager.save(campaign);

      const account = await this.accountService.create(
        {
          name: createCampaignDto.title,
          type: AccountType.ASSET,
          normal_balance: NormalBalanceType.CREDIT,
          campaign_id: campaign.id,
        },
        queryRunner.manager,
      );
      campaign.account = account;
      await queryRunner.manager.save(campaign);
      await queryRunner.commitTransaction();
      return campaign;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Public-friendly: `user` can be undefined when route is @Public().
   * Unauthenticated viewers (or Role.USER) see only ACTIVE campaigns.
   */
  async findAll(
    filterDto: CampaignFilterDto,
    user?: IUserIdentity, // <-- optional
  ): Promise<any[]> {
    this.logger.debug({
      function: 'findAll',
      filterDto,
    });

    const {
      limit,
      offset,
      country,
      organizer,
      organizer_id,
      beneficiaryType,
      minBeneficiaries,
      maxBeneficiaries,
      minTarget,
      maxTarget,
      isOneTime,
      fromDate,
      toDate,
    } = filterDto;

    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.account', 'account')
      .leftJoinAndSelect('campaign.organizer', 'organizer')
      .leftJoinAndSelect('campaign.targetBeneficiaries', 'targetBeneficiaries');

    if (country) {
      queryBuilder.andWhere('campaign.country = :country', { country });
    }

    // Determine role (may be undefined on public requests)
    const role = user?.role as Role | undefined;
    const isPrivileged = role === Role.ADMIN || role === Role.ORGANIZER;

    // Public viewers and basic users: show only ACTIVE campaigns
    if (!isPrivileged) {
      queryBuilder.andWhere('campaign.status = :status', {
        status: CampaignStatus.ACTIVE,
      });
    }

    if (organizer_id) {
      queryBuilder.andWhere('campaign.organizer_id IN (:...organizer_id)', {
        organizer_id,
      });
    } else if (organizer) {
      queryBuilder.andWhere('organizer.name LIKE :organizer', {
        organizer: `%${organizer}%`,
      });
    }

    if (beneficiaryType) {
      queryBuilder.andWhere('targetBeneficiaries.id IN (:...beneficiaryType)', {
        beneficiaryType,
      });
    }

    if (minBeneficiaries && maxBeneficiaries) {
      queryBuilder.andWhere(
        'campaign.num_beneficiaries BETWEEN :minBeneficiaries AND :maxBeneficiaries',
        { minBeneficiaries, maxBeneficiaries },
      );
    } else if (minBeneficiaries) {
      queryBuilder.andWhere('campaign.num_beneficiaries >= :minBeneficiaries', {
        minBeneficiaries,
      });
    } else if (maxBeneficiaries) {
      queryBuilder.andWhere('campaign.num_beneficiaries <= :maxBeneficiaries', {
        maxBeneficiaries,
      });
    }

    // (minTarget/maxTarget commented in your code — keep as-is if not used)

    if (isOneTime !== undefined) {
      queryBuilder.andWhere('campaign.method = :method', {
        method: isOneTime ? 'once' : 'monthly',
      });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere(
        'campaign.start_date BETWEEN :fromDate AND :toDate',
        { fromDate, toDate },
      );
    } else if (fromDate) {
      queryBuilder.andWhere('campaign.start_date >= :fromDate', { fromDate });
    } else if (toDate) {
      queryBuilder.andWhere('campaign.start_date <= :toDate', { toDate });
    }

    // Pagination with safe defaults
    const take = Number.isFinite(Number(limit)) ? Number(limit) : 20;
    const skip = Number.isFinite(Number(offset)) ? Number(offset) : 0;
    queryBuilder.skip(skip).take(take).orderBy('campaign.created_at', 'DESC');

    const campaigns = await queryBuilder.getMany();

    return campaigns.map((campaign) => ({
      ...Campaigns.getVirtualColumns(campaign),
      ...campaign,
    }));
  }

  async latestCampaigns(): Promise<any[]> {
    this.logger.debug({ function: 'latestCampaigns' });
    const campaigns = await this.campaignRepository.find({
      where: { status: CampaignStatus.ACTIVE },
      take: 2,
      order: { created_at: 'desc' },
    });
    return campaigns.map((campaign) => ({
      ...Campaigns.getVirtualColumns(campaign),
      ...campaign,
    }));
  }

  // async findOne(id: number): Promise<any> {
  //   this.logger.debug({ function: 'findOne', id });
  //   const campaign = await this.campaignRepository.findOne({
  //     where: { id },
  //     relations: {
  //       organizer: true,
  //       account: true,
  //       targetBeneficiaries: true,
  //     },
  //     select: {
  //       organizer: {
  //         id: true,
  //         name: true,
  //         overview: true,
  //         video_url: true,
  //         address: true,
  //         country: true,
  //         city: true,
  //         image: true,
  //         phone_number: true,
  //         email: true,
  //         website: true,
  //       },
  //     },
  //   });

  //   return {
  //     ...Campaigns.getVirtualColumns(campaign),
  //     ...campaign,
  //   };
  // }
  async findOne(id: number): Promise<any> {
    this.logger.debug({ function: 'findOne', id });

    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: {
        organizer: true,
        account: true,
        targetBeneficiaries: true,
        donations: {
          user: true,
        },
      },
      select: {
        organizer: {
          id: true,
          name: true,
          overview: true,
          video_url: true,
          address: true,
          country: true,
          city: true,
          image: true,
          phone_number: true,
          email: true,
          website: true,
        },
        donations: {
          id: true,
          amount: true,
          created_at: true,
          user: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Sort donations by date DESC (latest first) and map to desired shape
    const donations =
      campaign?.donations
        ?.slice() // avoid mutating original array
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .map((donation) => ({
          id: donation.id,
          userName: donation.user?.name,
          amount: donation.amount,
          date: donation.created_at,
        })) ?? [];

    return {
      ...Campaigns.getVirtualColumns(campaign),
      ...campaign,
      donations,
    };
  }



  async getCampaignImages(
    campaign_id: number,
    paginationDto: PaginationDto,
  ): Promise<CampaignImages[]> {
    this.logger.debug({ function: 'getCampaignImages', campaign_id });
    const { limit, offset } = paginationDto;
    const images = await this.campaignImagesRepository.find({
      where: { campaign_id },
      skip: offset ?? 0,
      take: limit ?? 20,
      order: { created_at: 'desc' },
    });
    return images;
  }

  async findOrganizerCampaign(campaign_id: number, organizer_id: number) {
    this.logger.debug({
      function: 'findOrganizerCampaign',
      campaign_id,
      organizer_id,
    });
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaign_id, organizer_id },
    });
    return campaign;
  }

  async update(
    id: number,
    updateCampaignDto: UpdateCampaignDto,
    loggedInUser: IUserIdentity,
    imageFile: Express.Multer.File,
  ) {
    this.logger.debug({
      function: 'update',
      id,
      loggedInUser,
      updateCampaignDto,
    });

    const campaign = await this.campaignRepository.findOneBy({ id });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (loggedInUser.role != 'admin') {
      if (campaign.organizer_id != loggedInUser.id) {
        throw new UnauthorizedException('You are not the organizer');
      }
    }

    const data = {
      ...updateCampaignDto,
      updated_by: loggedInUser.id,
    };
    delete data['image'];

    try {
      let relativePath: string | undefined;
      if (imageFile) {
        if (campaign.image) {
          this.storeImagesService.deleteImage(campaign.image);
        }
        relativePath = await this.storeImagesService.uploadImage(imageFile);
      }

      delete data['total_target'];
      await this.campaignRepository.update(id, {
        ...data,
        image: relativePath,
      });
    } catch (error) {
      this.logger.error('Failed to update campaign', error);
      throw error;
    }
  }

  async remove(id: number, loggedInUser: IUserIdentity) {
    this.logger.debug({ function: 'remove', id });
    const campaign = await this.campaignRepository.findOneBy({ id });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (loggedInUser.role != 'admin') {
      if (campaign.organizer_id != loggedInUser.id) {
        throw new UnauthorizedException('You are not the organizer');
      }
    }
    campaign.deleted_by = loggedInUser.id;
    await this.campaignRepository.save(campaign);
    await this.campaignRepository.softDelete(id);
  }

  async uploadCampaignImages(user, campaign_id, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file uploaded');
    const campaign = await this.campaignRepository.findOneBy({ id: campaign_id });
    if (campaign.organizer_id !== user.id) {
      throw new UnauthorizedException('You are not the organizer of this campaign');
    }
    const relativePath = await this.storeImagesService.uploadImage(file);
    const image = await this.campaignImagesRepository.create({
      campaign_id,
      path: relativePath,
    });
    await this.campaignImagesRepository.save(image);

    return {
      message: 'Campaign image uploaded successfully',
      imageUrl: relativePath,
      image,
    };
  }

  async deleteCampaignImage(user: IUserIdentity, campaign_id, imageId: number) {
    const campaign = await this.campaignRepository.findOneBy({ id: campaign_id });
    if (campaign.organizer_id !== user.id) {
      throw new UnauthorizedException('You are not the organizer of this campaign');
    }
    const image = await this.campaignImagesRepository.findOne({
      where: { id: imageId, campaign_id },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.storeImagesService.deleteImage(image.path);
    await this.campaignImagesRepository.remove(image);
    return { message: 'Campaign image deleted successfully' };
  }
}
