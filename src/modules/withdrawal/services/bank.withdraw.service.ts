import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankDto } from '../dto/bank.dto';
import { BankAccount } from '../entities/bank.withdraw.entity';

@Injectable()
export class BankWithdrawService {
  private readonly logger = new Logger(BankWithdrawService.name);
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankWithdrawRepository: Repository<BankAccount>,
  ) {}

  async createOrUpdate(user_id: number, dto: BankDto): Promise<BankAccount> {
    this.logger.debug({
      function: 'createOrUpdate',
      dto,
    });
    const existing = await this.bankWithdrawRepository.findOne({
      where: { user_id },
    });
    if (existing) {
      return this.bankWithdrawRepository.save({ id: existing.id, ...dto });
    }
    const account = new BankAccount({ ...dto, user_id });

    return this.bankWithdrawRepository.save(account);
  }

  getByUserId(user_id: number) {
    this.logger.debug({
      function: 'getByUserId',
      user_id,
    });
    return this.bankWithdrawRepository.findOne({
      where: { user_id },
    });
  }
}
