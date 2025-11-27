import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TargetBeneficiariesType } from '../entities/target-beneficiary.entity';
import { Repository } from 'typeorm';
import { CreateTargetBeneficiaryDto } from '../dto/create-target-beneficiaries.dto';
import { UpdateTargetBeneficiaryDto } from '../dto/update-target-beneficiaries.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TargetBeneficiariesService {
  private logger = new Logger(TargetBeneficiariesService.name);

  constructor(
    @InjectRepository(TargetBeneficiariesType)
    private readonly targetBeneficiaryRepository: Repository<TargetBeneficiariesType>,
  ) {}
  async create(
    createTargetBeneficiaryDto: CreateTargetBeneficiaryDto,
  ): Promise<TargetBeneficiariesType> {
    this.logger.debug({
      function: 'create',
      createTargetBeneficiaryDto,
    });
    const targetBeneficiary = this.targetBeneficiaryRepository.create({
      name: createTargetBeneficiaryDto.name,
    });
    return this.targetBeneficiaryRepository.save(targetBeneficiary);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<TargetBeneficiariesType[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.targetBeneficiaryRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<TargetBeneficiariesType> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.targetBeneficiaryRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateTargetBeneficiaryDto: UpdateTargetBeneficiaryDto,
    loggedInUserId,
  ): Promise<TargetBeneficiariesType> {
    this.logger.debug({
      function: 'update',
      id,
      updateTargetBeneficiaryDto,
      loggedInUserId,
    });
    const beneficiary = await this.targetBeneficiaryRepository.findOneBy({
      id,
    });
    if (!beneficiary) {
      throw new NotFoundException('target beneficiary not found');
    }

    const data = {
      name: updateTargetBeneficiaryDto.name,
      updated_by: loggedInUserId,
    };

    const updatedTargetBeneficiary = Object.assign(beneficiary, data);

    return this.targetBeneficiaryRepository.save(updatedTargetBeneficiary);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const targetBeneficiary = await this.targetBeneficiaryRepository.findOneBy({
      id,
    });
    if (!targetBeneficiary) {
      throw new NotFoundException('target beneficiary not found');
    }
    targetBeneficiary.deleted_by = loggedInUserId;
    await this.targetBeneficiaryRepository.save(targetBeneficiary);
    await this.targetBeneficiaryRepository.softDelete(id);
  }
}
