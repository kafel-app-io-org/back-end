import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { Transaction } from './transaction.entity';
import { AbstractEntity } from '../../../common/entities/abstract.model';

export enum EntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('entries')
export class Entry extends AbstractEntity<Entry> {
  @ManyToOne(() => Account, (account) => account.entries)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column()
  account_id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column()
  transaction_id: number;

  @Column({
    type: 'enum',
    enum: EntryType,
  })
  type: EntryType;

  @Column('integer')
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional metadata
}
