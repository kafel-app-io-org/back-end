import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Users } from 'src/modules/users/entities/users.entity';
import { Transaction } from 'src/modules/double-entry-ledger/entities/transaction.entity';
import { CryptoAccount } from './crypto.withdraw.entity';
import {BankAccount } from './bank.withdraw.entity';

export enum MethodType {
  BANK = 'bank',
  CRYPTO = 'crypto',
}
export enum WithdrawStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}
@Entity('withdraws')
export class Withdraw extends AbstractEntity<Withdraw> {
  @Column()
  status: string;

  @Column()
  user_id: number;

  @Column()
  transaction_id: number;

  @Column()
  type: string;

  @Column()
  amount: number;

  @Column()
  crypto_account_id?: number;

  @Column()
  bank_account_id?: number;

  @Column()
  comment?: string;

  @Column()
  fees_amount?: number;

  @ManyToOne(() => Users, (user) => user.withdraws)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Transaction, (transaction) => transaction.transfer)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => CryptoAccount, (cryptoAccount) => cryptoAccount.withdraws)
  @JoinColumn({ name: 'crypto_account_id' })
  cryptoAccount: CryptoAccount;

  @ManyToOne(() => BankAccount, (bankAccount) => bankAccount.withdraws)
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccount;
}
