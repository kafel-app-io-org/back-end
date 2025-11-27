import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Withdrawals } from './entities/withdrawal.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class WithdrawalService {
  private logger = new Logger(WithdrawalService.name);

  constructor(
    @InjectRepository(Withdrawals)
    private readonly withdrawalRepository: Repository<Withdrawals>,
  ) {}

  async create(createWithdrawalDto: CreateWithdrawalDto): Promise<Withdrawals> {
    this.logger.debug({
      function: 'create withdrawal data',
      createWithdrawalDto,
    });
    const withdrawal_data = this.withdrawalRepository.create({
      user_id: createWithdrawalDto.user_id,
      bank: createWithdrawalDto.bank,
      iban: createWithdrawalDto.iban,
      country: createWithdrawalDto.country,
      swift_code: createWithdrawalDto.swift_code,
      card: createWithdrawalDto.card,
      wallet_address: createWithdrawalDto.wallet_address,
    });
    return this.withdrawalRepository.save(withdrawal_data);
  }

  async findAll(paginationDto: PaginationDto): Promise<Withdrawals[]> {
    this.logger.debug({
      function: 'findAll  withdrawal data',
    });
    const { limit, offset } = paginationDto;
    return this.withdrawalRepository.find({
      skip: offset,
      take: limit,
      order: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Withdrawals> {
    this.logger.debug({
      function: 'findOne withdrawal data',
    });
    return this.withdrawalRepository.findOneByOrFail({ id: id });
  }

  async update(
    id: number,
    updateWithdrawalDto: UpdateWithdrawalDto,
    loggedInUserId,
  ): Promise<Withdrawals> {
    this.logger.debug({
      function: 'update withdrawal data',
      id,
      updateWithdrawalDto,
    });
    const withdrawal_data = await this.withdrawalRepository.findOneBy({ id });
    if (!withdrawal_data) {
      throw new NotFoundException('Withdrawal Data not found');
    }

    const data = {
      user_id: updateWithdrawalDto.user_id,
      bank: updateWithdrawalDto.bank,
      iban: updateWithdrawalDto.iban,
      country: updateWithdrawalDto.country,
      swift_code: updateWithdrawalDto.swift_code,
      card: updateWithdrawalDto.card,
      wallet_address: updateWithdrawalDto.wallet_address,
      updated_by: loggedInUserId,
    };

    const updatedData = Object.assign(withdrawal_data, data);

    return this.withdrawalRepository.save(updatedData);
  }

  async remove(id: number, loggedInUserId: number) {
    this.logger.debug({
      function: 'remove withdrawal data',
      id,
    });
    const withdrawal_data = await this.withdrawalRepository.findOneBy({ id });
    if (!withdrawal_data) {
      throw new NotFoundException('Withdrawal Data not found');
    }
    withdrawal_data.deleted_by = loggedInUserId;
    await this.withdrawalRepository.save(withdrawal_data);
    await this.withdrawalRepository.softDelete(id);
  }
}
