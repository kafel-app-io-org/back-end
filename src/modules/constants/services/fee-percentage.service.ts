/* eslint-disable prettier/prettier */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeePercentage } from '../entities/fee-percentage.entity';
import { UpdateFeePercentageDto } from '../dto/update-fee-percentage.dto'; 

@Injectable()
export class FeePercentageService {
  private logger = new Logger(FeePercentageService.name);

  constructor(
    @InjectRepository(FeePercentage)
    private readonly feePercentageRepository: Repository<FeePercentage>,
  ) {}
  

  async findAll(): Promise<FeePercentage[]> {
    this.logger.debug({
      function: 'findAll',
    });
    return this.feePercentageRepository.find();
  }

  async findOne(id: number): Promise<FeePercentage> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    return this.feePercentageRepository.findOneByOrFail({ id: id });
  }

  async getPercentageByType(type: string) {
    this.logger.debug({
      function: 'getPercentageByType',
      type,
    });
    const fee_percentage = await this.feePercentageRepository.findOneBy({
      type: type,
    });
    if (!fee_percentage) {
      throw new NotFoundException(`Fee percentage for type "${type}" not found`);
    }
  
    return fee_percentage.amount / 10000;
  }

  async update(
    id: number,
    updateFeePercentageDto: UpdateFeePercentageDto,
    loggedInUserId,
  ): Promise<FeePercentage> {
    this.logger.debug({
      function: 'update',
      id,
      updateFeePercentageDto,
      loggedInUserId,
    });
    const fee_percentage = await this.feePercentageRepository.findOneBy({
      id,
    });
    if (!fee_percentage) {
      throw new NotFoundException('fee percentage not found');
    }

    const data = {
      amount: updateFeePercentageDto.amount,
      updated_by: loggedInUserId,
    };

    const updatedFeePercentage = Object.assign(fee_percentage, data);

    return this.feePercentageRepository.save(updatedFeePercentage);
  }

}
