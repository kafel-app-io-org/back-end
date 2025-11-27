import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Transaction } from 'src/modules/double-entry-ledger/entities/transaction.entity';

export enum DepositStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('deposits')
export class Deposit extends AbstractEntity<Deposit> {
  @Column()
  user_id: number;

  @Column()
  intent_id: string;

  @Column({ nullable: true })
  transaction_id: number;

  @Column()
  status: string;

  @Column()
  amount: number;

  @Column()
  fees_amount: number;

  @Column()
  token_type: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.deposits)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
