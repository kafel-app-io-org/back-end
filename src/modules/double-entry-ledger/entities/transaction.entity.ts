import { Entity, Column, OneToMany } from 'typeorm';
import { Entry } from './entry.entity';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Deposit } from 'src/modules/users/entities/deposit.entity';
import { Donation } from 'src/modules/campaigns/entities/donation.entity';
import { Transfer } from 'src/modules/users/entities/transfer.entity';
import { Withdraw } from 'src/modules/withdrawal/entities/withdraw.entity';
import { Notifications } from 'src/modules/notifications/entities/notifications.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  VOIDED = 'voided',
}

@Entity('transactions')
export class Transaction extends AbstractEntity<Transaction> {
  @Column({ unique: true, nullable: true })
  transaction_number: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  external_id: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional metadata

  @OneToMany(() => Entry, (entry) => entry.transaction, { cascade: true })
  entries: Entry[];

  @OneToMany(() => Deposit, (deposit) => deposit.transaction)
  deposits: Deposit[];

  @OneToMany(() => Donation, (deposit) => deposit.transaction)
  donations: Donation[];

  @OneToMany(() => Transfer, (transfer) => transfer.transaction)
  transfer: Transfer[];

  @OneToMany(() => Withdraw, (withdraw) => withdraw.transaction)
  withdraw: Withdraw[];

  @OneToMany(() => Notifications, (notification) => notification.transaction)
  notifications: Notifications[];
}
