import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoAccount } from '../entities/crypto.withdraw.entity';
import { Repository } from 'typeorm';
import { CryptoDto } from '../dto/crypto.dto';

@Injectable()
export class CryptoWithdrawService {
  private readonly logger = new Logger(CryptoWithdrawService.name);
  constructor(
    @InjectRepository(CryptoAccount)
    private readonly cryptoWithdrawRepository: Repository<CryptoAccount>,
  ) {}

  async createOrUpdate(
    user_id: number,
    dto: CryptoDto,
  ): Promise<CryptoAccount> {
    this.logger.debug({
      function: 'createOrUpdate',
      dto,
      user_id,
    });
    const { wallet_address } = dto;
    const existing = await this.cryptoWithdrawRepository.findOne({
      where: { user_id },
    });
    if (existing) {
      return this.cryptoWithdrawRepository.save({
        id: existing.id,
        wallet_address,
      });
    }
    const account = new CryptoAccount({ wallet_address, user_id });
    return this.cryptoWithdrawRepository.save(account);
  }

  getByUserId(user_id: number) {
    this.logger.debug({
      function: 'getByUserId',
      user_id,
    });
    return this.cryptoWithdrawRepository.findOne({
      where: { user_id },
    });
  }
}
