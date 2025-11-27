import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Locations } from '../entities/locations.entity';
import { UpdateLocationsDto } from '../dto/update-locations.dto';
import { CreateLocationsDto } from '../dto/create-locations.dto';

@Injectable()
export class LocationsService {
  private logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(Locations)
    private readonly locationsRepository: Repository<Locations>,
  ) {}
  async create(
    createLocationsDto: CreateLocationsDto,
    user_id,
  ): Promise<Locations> {
    this.logger.debug({
      function: 'create',
      createLocationsDto,
    });
    const location = this.locationsRepository.create({
      name: createLocationsDto.name,
      code: createLocationsDto.code,
      created_by: user_id,
    });
    return this.locationsRepository.save(location);
  }

  async findAll(paginationDto: PaginationDto): Promise<Locations[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.locationsRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Locations> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.locationsRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateLocationsDto: UpdateLocationsDto,
    loggedInUserId,
  ): Promise<Locations> {
    this.logger.debug({
      function: 'update',
      id,
      updateLocationsDto,
      loggedInUserId,
    });
    const location = await this.locationsRepository.findOneBy({
      id,
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const data = {
      name: updateLocationsDto.name,
      code: updateLocationsDto.code,
      updated_by: loggedInUserId,
    };

    const updatedLocation = Object.assign(location, data);

    return this.locationsRepository.save(updatedLocation);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const location = await this.locationsRepository.findOneBy({
      id,
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    location.deleted_by = loggedInUserId;
    await this.locationsRepository.save(location);
    await this.locationsRepository.softDelete(id);
  }
}
