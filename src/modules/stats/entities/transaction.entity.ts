import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Campaign } from './campaign.entity';

export enum TransactionType {
  TRANSFER = 'transfer',
  WITHDRAW = 'withdraw',
  DEPOSIT = 'deposit',
  DONATION = 'donation',
  OTHER = 'other',
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'fee_amount',
    default: 0,
  })
  feeAmount: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Campaign, { nullable: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
