import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from './entities/user.entity';
import { Campaign } from './entities/campaign.entity';
import { Donation } from './entities/donation.entity';
import { Withdraw } from './entities/withdraw.entity';
import { Deposit } from './entities/deposit.entity';
import { Transfer } from './entities/transfer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Campaign,
      Donation,
      Withdraw,
      Deposit,
      Transfer,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
