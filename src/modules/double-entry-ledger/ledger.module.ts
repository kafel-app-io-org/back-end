import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { Entry } from './entities/entry.entity';
import { AccountService } from './services/account.service';
import { TransactionService } from './services/transaction.service';
import { AccountController } from './controllers/account.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction, Entry])],
  controllers: [AccountController],
  providers: [AccountService, TransactionService],
  exports: [AccountService,
           TransactionService,
           TypeOrmModule, // re-export so repositories can be injected downstream if needed
  ],
})
export class LedgerModule {}
