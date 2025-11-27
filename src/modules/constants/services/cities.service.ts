/* eslint-disable prettier/prettier */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Cities } from '../entities/cities.entity';
import { CreateCitiesDto } from '../dto/create-cities.dto';
import { UpdateCitiesDto } from '../dto/update-cities.dto';

@Injectable()
export class CitiesService {
  private logger = new Logger(CitiesService.name);

  constructor(
    @InjectRepository(Cities)
    private readonly citiesRepository: Repository<Cities>,
  ) {}
  async create(
    createCitiesDto: CreateCitiesDto,
    user_id,
  ): Promise<Cities> {
    this.logger.debug({
      function: 'create',
      createCitiesDto,
    });
    const city = this.citiesRepository.create({
      name: createCitiesDto.name,
      created_by: user_id,
    });
    return this.citiesRepository.save(city);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<Cities[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.citiesRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Cities> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.citiesRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateCitiesDto: UpdateCitiesDto,
    loggedInUserId,
  ): Promise<Cities> {
    this.logger.debug({
      function: 'update',
      id,
      updateCitiesDto,
      loggedInUserId,
    });
    const city = await this.citiesRepository.findOneBy({
      id,
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const data = {
      name: updateCitiesDto.name,
      updated_by: loggedInUserId,
    };

    const updatedCity = Object.assign(city, data);

    return this.citiesRepository.save(updatedCity);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const city = await this.citiesRepository.findOneBy({
      id,
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    city.deleted_by = loggedInUserId;
    await this.citiesRepository.save(city);
    await this.citiesRepository.softDelete(id);
  }
}
