import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Users } from 'src/modules/users/entities/users.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Campaigns } from './campaign.entity';
import { BeneficiaryDistribution } from './beneficiary-distribution.entity';

@Entity()
export class BeneficiaryCampaigns extends AbstractEntity<BeneficiaryCampaigns> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  campaign_id: number;

  @Column({ default: 0 })
  distributed_amount: number;

  @ManyToOne(() => Users, (user) => user.beneficiaryCampaigns)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Campaigns, (campaign) => campaign.beneficiaryCampaigns)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaigns;

  @OneToMany(
    () => BeneficiaryDistribution,
    (distribution) => distribution.beneficiaryCampaign,
  )
  distributions: BeneficiaryDistribution[];
}
