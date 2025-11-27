import { Injectable, Logger } from '@nestjs/common';
import { Users } from '../entities/users.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/common/enum/role.enum';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import {
  AccountType,
  NormalBalanceType,
} from '../../double-entry-ledger/entities/account.entity';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { join } from 'path';
import * as fs from 'fs';
import { StoreImagesService } from 'src/modules/storage/services/store-images.service';

@Injectable()
export class BeneficiaryService {
  private readonly logger = new Logger(BeneficiaryService.name);

  constructor(
    @InjectRepository(Users)
    private readonly beneficiaryRepository: Repository<Users>,
    private readonly dataSource: DataSource,
    private readonly accountService: AccountService,
    private readonly storeImageService: StoreImagesService,
  ) {}

  async createBeneficiary(
    createUserDto: CreateBeneficiaryDto,
    loggedInUserId: number,
    file: Express.Multer.File = null,
  ): Promise<Users> {
    this.logger.debug({
      function: 'createBeneficiary',
      loggedInUserId,
      createUserDto,
    });
    let imagePath: string | undefined;
    if (file) {
      imagePath = await this.storeImageService.uploadImage(file);
    }

    // Check if user with phone number already exists
    const existingUser = await this.beneficiaryRepository.findOne({
      where: { phone_number: createUserDto.phone_number },
    });

    if (existingUser) {
      existingUser.is_beneficiary = true;
      if (imagePath) existingUser.image = imagePath;
      return this.beneficiaryRepository.save(existingUser);
    }

    // Use a transaction to ensure both user and account creation succeed or fail together
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the beneficiary user
      const user = this.beneficiaryRepository.create({
        ...createUserDto,
        image: imagePath,
        role: Role.USER,
        created_by: loggedInUserId,
        is_beneficiary: true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create an account for the beneficiary
      await this.accountService.create(
        {
          user_id: savedUser.id,
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

  async findOne(id: number): Promise<Users> {
    this.logger.debug({
      function: 'findAll Beneficiaries',
      id,
    });

    return this.beneficiaryRepository.findOne({
      where: {
        id: id,
        is_beneficiary: true,
      },
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true,
        country: true,
        city: true,
        status: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<Users[]> {
    this.logger.debug({
      function: 'findAll Beneficiaries',
      paginationDto,
    });

    const { limit, offset } = paginationDto;
    return this.beneficiaryRepository.find({
      where: { is_beneficiary: true },
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true,
        country: true,
        city: true,
        status: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async update(
    id: number,
    updateBeneficiaryDto: UpdateBeneficiaryDto,
    loggedInUser: IUserIdentity,
    file: Express.Multer.File,
  ): Promise<Users> {
    this.logger.debug({
      function: 'update Beneficiary',
      id,
      loggedInUser,
      updateBeneficiaryDto,
    });
    let imagePath: string | undefined;
    if (file) {
      imagePath = await this.storeImageService.uploadImage(file);
    }

    const beneficiary = await this.beneficiaryRepository.findOneOrFail({
      where: { id, is_beneficiary: true },
    });

    const updatedBeneficiary = Object.assign(beneficiary, {
      ...updateBeneficiaryDto,
      updated_by: loggedInUser.id,
    });
    if (imagePath) updatedBeneficiary.image = imagePath;
    return this.beneficiaryRepository.save(updatedBeneficiary);
  }
}
