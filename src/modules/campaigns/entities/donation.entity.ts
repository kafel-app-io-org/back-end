import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Campaigns } from './campaign.entity';
import { Users } from '../../users/entities/users.entity';
import { BeneficiaryDistribution } from './beneficiary-distribution.entity';
import { Transaction } from 'src/modules/double-entry-ledger/entities/transaction.entity';

export enum DonationStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('donations')
export class Donation extends AbstractEntity<Donation> {
  @Column()
  amount: number;

  @Column()
  campaign_id: number;

  @Column()
  transaction_id: number;

  @Column()
  user_id: number;

  @Column({
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: string;

  @ManyToOne(() => Campaigns, (campaign) => campaign.donations)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaigns;

  @ManyToOne(() => Users, (user) => user.donation)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(
    () => BeneficiaryDistribution,
    (distribution) => distribution.donation,
  )
  distributions: BeneficiaryDistribution[];

  @ManyToOne(() => Transaction, (transaction) => transaction.donations)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
