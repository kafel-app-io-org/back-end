import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserTypes } from '../entities/user-types.entity';
import { CreateUserTypesDto } from '../dto/create-user-types.dto';
import { UpdateUserTypesDto } from '../dto/update-user-types.dto';

@Injectable()
export class UserTypesService {
  private logger = new Logger(UserTypesService.name);

  constructor(
    @InjectRepository(UserTypes)
    private readonly userTypesRepository: Repository<UserTypes>,
  ) {}
  async create(
    createUserTypesDto: CreateUserTypesDto,
    user_id,
  ): Promise<UserTypes> {
    this.logger.debug({
      function: 'create',
      createUserTypesDto,
    });
    const userType = this.userTypesRepository.create({
      name: createUserTypesDto.name,
      created_by: user_id,
    });
    return this.userTypesRepository.save(userType);
  }

  async findAll(paginationDto: PaginationDto): Promise<UserTypes[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.userTypesRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<UserTypes> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.userTypesRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateUserTypesDto: UpdateUserTypesDto,
    loggedInUserId,
  ): Promise<UserTypes> {
    this.logger.debug({
      function: 'update',
      id,
      updateUserTypesDto,
      loggedInUserId,
    });
    const userType = await this.userTypesRepository.findOneBy({
      id,
    });
    if (!userType) {
      throw new NotFoundException('User Type not found');
    }

    const data = {
      name: updateUserTypesDto.name,
      updated_by: loggedInUserId,
    };

    const updatedUserType = Object.assign(userType, data);

    return this.userTypesRepository.save(updatedUserType);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const userType = await this.userTypesRepository.findOneBy({
      id,
    });
    if (!userType) {
      throw new NotFoundException(' not found');
    }
    userType.deleted_by = loggedInUserId;
    await this.userTypesRepository.save(userType);
    await this.userTypesRepository.softDelete(id);
  }
}
