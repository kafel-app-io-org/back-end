import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DistributionMethods } from '../entities/distribution-methods.entity';
import { CreateDistributionMethodsDto } from '../dto/create-distribution-methods.dto';
import { UpdateDistributionMethodsDto } from '../dto/update-distribution-methods.dto';

@Injectable()
export class DistributionMethodsService {
  private logger = new Logger(DistributionMethodsService.name);

  constructor(
    @InjectRepository(DistributionMethods)
    private readonly distributedMethodsRepository: Repository<DistributionMethods>,
  ) {}
  async create(
    createDistributionMethodsDto: CreateDistributionMethodsDto,
    user_id,
  ): Promise<DistributionMethods> {
    this.logger.debug({
      function: 'create',
      createDistributionMethodsDto,
    });
    const distributionMethod = this.distributedMethodsRepository.create({
      name: createDistributionMethodsDto.name,
      created_by: user_id,
    });
    return this.distributedMethodsRepository.save(distributionMethod);
  }

  async findAll(paginationDto: PaginationDto): Promise<DistributionMethods[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.distributedMethodsRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<DistributionMethods> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.distributedMethodsRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateDistributionMethodsDto: UpdateDistributionMethodsDto,
    loggedInUserId,
  ): Promise<DistributionMethods> {
    this.logger.debug({
      function: 'update',
      id,
      updateDistributionMethodsDto,
      loggedInUserId,
    });
    const distributionMethod =
      await this.distributedMethodsRepository.findOneBy({
        id,
      });
    if (!distributionMethod) {
      throw new NotFoundException('Distribution Method not found');
    }

    const data = {
      name: updateDistributionMethodsDto.name,
      updated_by: loggedInUserId,
    };

    const updatedDistributionMethod = Object.assign(distributionMethod, data);

    return this.distributedMethodsRepository.save(updatedDistributionMethod);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const distributionMethod =
      await this.distributedMethodsRepository.findOneBy({
        id,
      });
    if (!distributionMethod) {
      throw new NotFoundException('Distribution Method not found');
    }
    distributionMethod.deleted_by = loggedInUserId;
    await this.distributedMethodsRepository.save(distributionMethod);
    await this.distributedMethodsRepository.softDelete(id);
  }
}
