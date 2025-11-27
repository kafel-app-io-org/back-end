import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Users } from './users.entity';
import { Transaction } from 'src/modules/double-entry-ledger/entities/transaction.entity';

export enum TransferStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transfers')
export class Transfer extends AbstractEntity<Transfer> {
  @Column()
  sender_user_id: number;

  @Column()
  receiver_user_id: number;

  @Column()
  transaction_id: number;

  @Column({
    enum: TransferStatus,
    default: TransferStatus.SUCCESS,
  })
  status: string;

  @Column()
  amount: number;

  @Column()
  comment: string;

  @Column()
  fees_amount?: number;

  @ManyToOne(() => Users, (user) => user.id)
  @JoinColumn({ name: 'sender_user_id' })
  sender: Users;

  @ManyToOne(() => Users, (user) => user.id)
  @JoinColumn({ name: 'receiver_user_id' })
  receiver: Users;

  @ManyToOne(() => Transaction, (transaction) => transaction.transfer)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
