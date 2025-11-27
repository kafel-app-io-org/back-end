import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Entry } from './entry.entity';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Users } from '../../users/entities/users.entity';
import { Campaigns } from '../../campaigns/entities/campaign.entity';

export enum SystemRole {
  CASH = 'cash',
  DEPOSIT_FEE = 'deposit_fee',
  WITHDRAW_FEE = 'withdraw_fee',
  TRANSFER_FEE = 'transfer_fee',
}
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum NormalBalanceType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

@Entity('accounts')
export class Account extends AbstractEntity<Account> {
  @Column()
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: NormalBalanceType,
    default: NormalBalanceType.DEBIT,
  })
  normal_balance: string;

  @Column()
  posted_balance: number;

  @Column()
  available_balance: number;

  @Column()
  pending_balance: number;

  @Column({ unique: true })
  account_number?: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.ASSET,
  })
  type: AccountType;

  @Column({ default: 'USDT' })
  currency: string;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Column({ default: false })
  is_contra_account: boolean;

  @Column({ nullable: true })
  parent_account_id: number;

  @Column()
  system_role: string;

  @Column({ nullable: true })
  user_id: number;

  @Column({ nullable: true })
  campaign_id: number;

  @OneToMany(() => Entry, (entry) => entry.account)
  entries: Entry[];

  @ManyToOne(() => Users, (user) => user.accounts)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToOne(() => Campaigns, (campaign) => campaign.account)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaigns;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional metadata
}
