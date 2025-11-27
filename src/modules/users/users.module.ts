import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Users } from './entities/users.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { LedgerModule } from '../double-entry-ledger/ledger.module';
import { Transfer } from './entities/transfer.entity';
import { TransferController } from './controllers/transfer.controller';
import { TransferService } from './services/transfer.service';
import { DepositController } from './controllers/deposit.controller';
import { Deposit } from './entities/deposit.entity';
import { DepositService } from './services/deposit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionHistoryService } from './services/transaction-history.service';
import { TransactionHistoryController } from './controllers/transaction-history.controller';
import { Withdraw } from '../withdrawal/entities/withdraw.entity';
import { BeneficiaryController } from './controllers/beneficiary.controller';
import { BeneficiaryService } from './services/beneficiary.service';
import { ConstantsModule } from '../constants/constants.module';
import { Donation } from '../campaigns/entities/donation.entity';
import { StorageModule } from '../storage/storage.module';
import { Images } from './entities/images.entity';
import { DepositCryptoService } from './services/deposit-crypto.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Users,
      Transfer,
      Deposit,
      Withdraw,
      Donation,
      Images,
    ]),
    LedgerModule,
    NotificationsModule,
    ConstantsModule,
    StorageModule,
  ],
  controllers: [
    UsersController,
    TransferController,
    DepositController,
    TransactionHistoryController,
    BeneficiaryController,
  ],
  providers: [
    UsersService,
    TransferService,
    DepositService,
    DepositCryptoService,
    TransactionHistoryService,
    BeneficiaryService,
  ],
  exports: [
    UsersService,
    TransferService,
    TransactionHistoryService,
    BeneficiaryService,
  ],
})
export class UsersModule {}
