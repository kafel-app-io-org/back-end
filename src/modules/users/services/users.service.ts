import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DataSource, Repository } from 'typeorm';
import { Users } from '../entities/users.entity';
import { hashPassword } from 'src/common/utils/bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AccountType,
  NormalBalanceType,
} from '../../double-entry-ledger/entities/account.entity';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { MethodType } from '../../withdrawal/entities/withdraw.entity';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { StoreImagesService } from 'src/modules/storage/services/store-images.service';
import { UpdateOrganizerProfileDto } from '../dto/update-organizer-profile.dto';
import { Images } from 'src/modules/users/entities/images.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Images)
    private readonly imagesRepository: Repository<Images>,
    private readonly dataSource: DataSource,
    private readonly accountService: AccountService,
    private readonly storeImageService: StoreImagesService,
  ) {}

  getProfile(id: number): any {
    return this.userRepository.findOne({
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        image: true,
        address: true,
        country: true,
        city: true,
        website: true,
        icon: true,
        overview: true,
        video_url: true,
        images: true,
        is_beneficiary: true,
      },
      where: {
        id,
      },
    });
  }

  async updateProfile(
    user: IUserIdentity,
    dto: UpdateProfileDto,
    file: Express.Multer.File,
  ) {
    this.logger.debug({
      function: 'updateProfile',
      dto,
    });
    // console.log("RSR-2 Update profile..!");
    const currentUser = await this.userRepository.findOneBy({ id: user.id });
    let imagePath: string | undefined;

    if (file) {
      imagePath = await this.storeImageService.uploadImage(file);
      await this.storeImageService.deleteImage(currentUser.image);
    }
    const data: any = { ...dto };
    if (imagePath) data.image = imagePath;
    await this.userRepository.update(user.id, { ...data });
    return this.userRepository.findOne({
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        image: true,
        address: true,
        country: true,
        city: true,
        website: true,
        icon: true,
        overview: true,
        video_url: true,
        images: true,
      },
      where: { id: user.id },
    });
  }

  async getNotConnectedBeneficiaries(campaign_id: string) {
    this.logger.debug({
      function: 'getNotConnectedBeneficiaries',
      campaign_id,
    });

    // Get all users who are active beneficiaries (role = 'user')
    // and not already connected to the specified campaign
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        'user.beneficiaryCampaigns',
        'bc',
        'bc.campaign_id = :campaignId',
        { campaignId: campaign_id },
      )
      .where('user.role = :role', { role: 'user' })
      .andWhere('user.status = :status', { status: 'active' })
      .andWhere('bc.id IS NULL');

    const users = await queryBuilder.getMany();

    return users;
  }

  async getConnectedBeneficiaries(campaign_id: string) {
    this.logger.debug({
      function: 'getConnectedBeneficiaries',
      campaign_id,
    });

    // Get all users who are active beneficiaries (role = 'user')
    // and are connected to the specified campaign
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'user.beneficiaryCampaigns',
        'bc',
        'bc.campaign_id = :campaignId',
        { campaignId: campaign_id },
      )
      .where('user.role = :role', { role: 'user' })
      .andWhere('user.status = :status', { status: 'active' });

    const users = await queryBuilder.getMany();

    return users;
  }

  async getWithdrawMethodPreference(user_id: number) {
    this.logger.debug({
      function: 'getWithdrawMethodPreference',
      user_id,
    });
    const user = await this.userRepository.findOneByOrFail({ id: user_id });
    console.log(user);
    return { method: user.withdraw_method_preference };
  }

  async changeWithdrawMethodPreference(method: MethodType, user_id: number) {
    this.logger.debug({
      function: 'changeWithdrawMethodPreference',
      user_id,
      method,
    });
    const user = await this.userRepository.findOneByOrFail({ id: user_id });
    user.withdraw_method_preference = method;
    return this.userRepository.save(user);
  }

  getOrganizers(paginationDto: PaginationDto) {
    return this.userRepository.find({
      where: { role: 'organizer' },
      relations: {
        images: true,
      },
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true,
        country: true,
        city: true,
        image: true,
        created_at: true,
        status: true,
        notes: true,
        address: true,
        birth_date: true,
        health_status: true,
        national_id: true,
        website: true,
        icon: true,
        overview: true,
        video_url: true,
      },
      skip: paginationDto.offset,
      take: paginationDto.limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async create(
    createUserDto: CreateUserDto,
    loggedInUserId: number,
  ): Promise<Users> {
    this.logger.debug({
      function: 'create User',
      loggedInUserId,
      data: {
        name: createUserDto.name,
        phone_number: createUserDto.phone_number,
        role: createUserDto.role,
        country: createUserDto.country,
        city: createUserDto.city,
        email: createUserDto.email,
        notes: createUserDto.notes,
        status: createUserDto.status,
      },
    });
    const user = this.userRepository.create({
      name: createUserDto.name,
      phone_number: createUserDto.phone_number,
      password: await hashPassword(createUserDto.password),
      role: createUserDto.role ? createUserDto.role : 'user',
      country: createUserDto.country,
      city: createUserDto.city,
      email: createUserDto.email,
      notes: createUserDto.notes,
      status: createUserDto.status,
      created_by: loggedInUserId,
    });
    return this.userRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto): Promise<Users[]> {
    this.logger.debug({
      function: 'findAll User',
    });
    const { limit, offset } = paginationDto;
    return this.userRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number, loggedInUser): Promise<Users> {
    this.logger.debug({
      function: 'findOne User',
      id,
      loggedInUser,
    });
    const user = this.userRepository.findOneByOrFail({ id: id });
    if (loggedInUser.role != 'admin' && id != loggedInUser.id) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
    return user;
  }

  async findOneBy(condition): Promise<Users> {
    this.logger.debug({
      function: 'findOneBy User',
      condition,
    });
    return this.userRepository.findOneBy(condition);
  }

  async editProfile(
    updateUserDto: UpdateUserDto,
    loggedInUser,
  ): Promise<Users> {
    this.logger.debug({
      function: 'editProfile',
      loggedInUser,
      data: {
        name: updateUserDto.name,
        phone_number: updateUserDto.phone_number,
        country: updateUserDto.country,
        city: updateUserDto.city,
        email: updateUserDto.email,
        notes: updateUserDto.notes,
        role: updateUserDto.role,
      },
    });
    const user = await this.userRepository.findOneBy({ id: loggedInUser.id });
    const data = {
      name: updateUserDto.name,
      phone_number: updateUserDto.phone_number,
      country: updateUserDto.country,
      city: updateUserDto.city,
      email: updateUserDto.email,
      notes: updateUserDto.notes,
      role: updateUserDto.role,
      updated_by: loggedInUser.id,
    };

    if (updateUserDto.password) {
      data['password'] = await hashPassword(updateUserDto.password);
    }

    const updatedUser = Object.assign(user, data);

    return this.userRepository.save(updatedUser);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    loggedInUser,
  ): Promise<Users> {
    this.logger.debug({
      function: 'update User',
      id,
      loggedInUser,
      data: {
        name: updateUserDto.name,
        phone_number: updateUserDto.phone_number,
        country: updateUserDto.country,
        city: updateUserDto.city,
        email: updateUserDto.email,
        notes: updateUserDto.notes,
        role: updateUserDto.role,
        status: updateUserDto.status,
      },
    });
    const user = await this.userRepository.findOneBy({ id });
    if (loggedInUser.role != 'admin' && user.id != loggedInUser.id) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data = {
      name: updateUserDto.name,
      phone_number: updateUserDto.phone_number,
      country: updateUserDto.country,
      city: updateUserDto.city,
      email: updateUserDto.email,
      notes: updateUserDto.notes,
      role: updateUserDto.role,
      status: updateUserDto.status,
      updated_by: loggedInUser.id,
    };

    if (updateUserDto.password) {
      data['password'] = await hashPassword(updateUserDto.password);
    }

    const updatedUser = Object.assign(user, data);

    return this.userRepository.save(updatedUser);
  }

  async remove(id: number, loggedInUserId: number) {
    this.logger.debug({
      function: 'remove User',
      id,
      loggedInUserId,
    });
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.deleted_by = loggedInUserId;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);
  }

  async findOrCreateByPhone(phone: string) {
    this.logger.debug({
      function: 'findOrCreateByPhone',
      phone,
    });
    let user = await this.userRepository.findOne({
      where: { phone_number: phone },
    });
    if (user) return user;
    // Use a transaction to ensure all operations succeed or fail together
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user = this.userRepository.create({
        phone_number: phone,
        role: 'user',
      });
      const savedUser = await queryRunner.manager.save(user);
      await this.accountService.create(
        {
          user_id: user.id,
          name: 'wallet',
          type: AccountType.ASSET,
          normal_balance: NormalBalanceType.CREDIT,
        },
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateOrganizerProfile(
    updateOrganizerProfileDto: UpdateOrganizerProfileDto,
    loggedInUser,
    image?: Express.Multer.File,
    icon?: Express.Multer.File,
    // images?: Express.Multer.File[],
  ) {
    this.logger.debug({
      function: 'updateOrganizerProfile',
      updateOrganizerProfileDto,
      loggedInUser,
    });

    const user = await this.userRepository.findOneBy({ id: loggedInUser.id });

    const data: Partial<Users> = {
      ...updateOrganizerProfileDto,
      updated_by: loggedInUser.id,
    };

    if (image) {
      if (user.image) {
        await this.storeImageService.deleteImage(user.image);
      }
      data.image = await this.storeImageService.uploadImage(image);
    } else {
      data.image = user.image;
    }

    if (icon) {
      if (user.icon) {
        await this.storeImageService.deleteImage(user.icon);
      }
      data.icon = await this.storeImageService.uploadImage(icon);
    } else {
      data.icon = user.icon;
    }

    // if (images?.length) {
    //   const oldImages = await this.imagesRepository.find({
    //     where: { user_id: loggedInUser.id },
    //   });

    //   await Promise.all(
    //     oldImages.map(async (img) => {
    //       await this.storeImageService.deleteImage(img.path);
    //       await this.imagesRepository.remove(img);
    //     }),
    //   );

    //   const imagesPaths = await Promise.all(
    //     images.map((img) => this.storeImageService.uploadImage(img)),
    //   );

    //   const newImages = imagesPaths.map((path) =>
    //     this.imagesRepository.create({ user_id: loggedInUser.id, path }),
    //   );

    //   await this.imagesRepository.save(newImages);
    // }
    // delete data['images'];
    await this.userRepository.update(user.id, data);

    return this.userRepository.findOne({
      where: { id: user.id },
      relations: { images: true },
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true,
        country: true,
        city: true,
        image: true,
        created_at: true,
        status: true,
        notes: true,
        address: true,
        birth_date: true,
        health_status: true,
        national_id: true,
        website: true,
        icon: true,
        overview: true,
        video_url: true,
      },
    });
  }

  async uploadOrganizerImages(user, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    // Upload file and get relative path
    const relativePath = await this.storeImageService.uploadImage(file);

    // Update user record with image path
    const image = await this.imagesRepository.create({
      user_id: user.id,
      path: relativePath,
    });
    await this.imagesRepository.save(image);
    return {
      message: 'Organizer image uploaded successfully',
      imageUrl: relativePath,
      image: image,
    };
  }

  async deleteOrganizerImage(user: IUserIdentity, imageId: number) {
    const image = await this.imagesRepository.findOne({
      where: { id: imageId, user_id: user.id },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete the image file from storage
    await this.storeImageService.deleteImage(image.path);

    // Remove the image record from the database
    await this.imagesRepository.remove(image);

    return { message: 'Organizer image deleted successfully' };
  }
}
