/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountriesDialCode } from '../entities/countries-dial-code.entity';

@Injectable()
export class CountriesDialCodeService {
  private logger = new Logger(CountriesDialCodeService.name);

  constructor(
    @InjectRepository(CountriesDialCode)
    private readonly countriesDialCodeRepository: Repository<CountriesDialCode>,
  ) {}

  async findAll(): Promise<CountriesDialCode[]> {
    this.logger.debug({
      function: 'findAll',
    });
    return this.countriesDialCodeRepository.find({
      order: {
        name: 'asc',
      },
    });
  }
}
