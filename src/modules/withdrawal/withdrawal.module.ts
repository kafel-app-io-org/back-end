import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Withdrawals } from './entities/withdrawal.entity';
import { BankAccount } from './entities/bank.withdraw.entity';
import { Withdraw } from './entities/withdraw.entity';
import { CryptoAccount } from './entities/crypto.withdraw.entity';
import { CryptoWithdrawService } from './services/crypto.withdraw.service';
import { BankWithdrawService } from './services/bank.withdraw.service';
import { WithdrawService } from './services/withdraw.service';
import { WithdrawController } from './controllers/withdraw.controller';
import { BankWithdrawController } from './controllers/bank.withdraw.controller';
import { CryptoWithdrawController } from './controllers/crypto.withdraw.controller';
import { LedgerModule } from '../double-entry-ledger/ledger.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConstantsModule } from '../constants/constants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Withdrawals,
      CryptoAccount,
      Withdraw,
      BankAccount,
    ]),
    LedgerModule,
    NotificationsModule,
    ConstantsModule,
  ],
  controllers: [
    WithdrawController,
    BankWithdrawController,
    CryptoWithdrawController,
  ],
  providers: [
    WithdrawalService,
    CryptoWithdrawService,
    BankWithdrawService,
    WithdrawService,
  ],
})
export class WithdrawalModule {}
