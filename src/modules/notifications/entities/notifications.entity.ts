import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from 'src/modules/users/entities/users.entity';
import { Transaction } from 'src/modules/double-entry-ledger/entities/transaction.entity';

@Entity()
export class Notifications {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  details: string;

  @Column()
  arabic_title: string;

  @Column()
  arabic_details: string;

  @Column()
  is_read: boolean;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  transaction_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => Users, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Transaction, (transaction) => transaction.notifications)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
