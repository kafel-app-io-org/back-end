import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TransactionTypes } from '../entities/transaction-types.entity';
import { CreateTransactionTypesDto } from '../dto/create-transaction-types.dto';
import { UpdateTransactionTypesDto } from '../dto/update-transaction-types.dto';

@Injectable()
export class TransactionTypesService {
  private logger = new Logger(TransactionTypesService.name);

  constructor(
    @InjectRepository(TransactionTypes)
    private readonly transactionTypesRepository: Repository<TransactionTypes>,
  ) {}
  async create(
    createTransactionTypesDto: CreateTransactionTypesDto,
    user_id,
  ): Promise<TransactionTypes> {
    this.logger.debug({
      function: 'create',
      createTransactionTypesDto,
    });
    const transactionType = this.transactionTypesRepository.create({
      name: createTransactionTypesDto.name,
      created_by: user_id,
    });
    return this.transactionTypesRepository.save(transactionType);
  }

  async findAll(paginationDto: PaginationDto): Promise<TransactionTypes[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.transactionTypesRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<TransactionTypes> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.transactionTypesRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateTransactionTypesDto: UpdateTransactionTypesDto,
    loggedInUserId,
  ): Promise<TransactionTypes> {
    this.logger.debug({
      function: 'update',
      id,
      updateTransactionTypesDto,
      loggedInUserId,
    });
    const transactionType = await this.transactionTypesRepository.findOneBy({
      id,
    });
    if (!transactionType) {
      throw new NotFoundException('Transaction Types not found');
    }

    const data = {
      name: updateTransactionTypesDto.name,
      updated_by: loggedInUserId,
    };

    const updatedTransactionTypes = Object.assign(transactionType, data);

    return this.transactionTypesRepository.save(updatedTransactionTypes);
  }

  async remove(id: number, loggedInUserId) {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const transactionType = await this.transactionTypesRepository.findOneBy({
      id,
    });
    if (!transactionType) {
      throw new NotFoundException('Transaction Types not found');
    }
    transactionType.deleted_by = loggedInUserId;
    await this.transactionTypesRepository.save(transactionType);
    await this.transactionTypesRepository.softDelete(id);
  }
}
