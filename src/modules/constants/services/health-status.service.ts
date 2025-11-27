import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HealthStatus } from '../entities/health-status.entity';
import { UpdateHealthStatusDto } from '../dto/update-health-status.dto';
import { CreateHealthStatusDto } from '../dto/create-health-status.dto';

@Injectable()
export class HealthStatusService {
  private logger = new Logger(HealthStatusService.name);

  constructor(
    @InjectRepository(HealthStatus)
    private readonly healthStatusRepository: Repository<HealthStatus>,
  ) {}
  async create(
    createHealthStatusDto: CreateHealthStatusDto,
    user_id,
  ): Promise<HealthStatus> {
    this.logger.debug({
      function: 'create',
      createHealthStatusDto,
    });
    const healthStatus = this.healthStatusRepository.create({
      name: createHealthStatusDto.name,
      created_by: user_id,
    });
    return this.healthStatusRepository.save(healthStatus);
  }

  async findAll(paginationDto: PaginationDto): Promise<HealthStatus[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.healthStatusRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<HealthStatus> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.healthStatusRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateHealthStatusDto: UpdateHealthStatusDto,
    loggedInUserId,
  ): Promise<HealthStatus> {
    this.logger.debug({
      function: 'update',
      id,
      updateHealthStatusDto,
      loggedInUserId,
    });
    const healthStatus = await this.healthStatusRepository.findOneBy({
      id,
    });
    if (!healthStatus) {
      throw new NotFoundException('Health Status not found');
    }

    const data = {
      name: updateHealthStatusDto.name,
      updated_by: loggedInUserId,
    };

    const updatedHealthStatus = Object.assign(healthStatus, data);

    return this.healthStatusRepository.save(updatedHealthStatus);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const healthStatus = await this.healthStatusRepository.findOneBy({
      id,
    });
    if (!healthStatus) {
      throw new NotFoundException('Health Status not found');
    }
    healthStatus.deleted_by = loggedInUserId;
    await this.healthStatusRepository.save(healthStatus);
    await this.healthStatusRepository.softDelete(id);
  }
}
