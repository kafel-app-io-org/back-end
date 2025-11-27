import { AbstractEntity } from 'src/common/entities/abstract.model';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BeneficiaryCampaigns } from './beneficiary-campaigns.entity';
import { Donation } from './donation.entity';

@Entity('beneficiary_distribution')
export class BeneficiaryDistribution extends AbstractEntity<BeneficiaryDistribution> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  beneficiary_campaign_id: number;

  @Column()
  beneficiary_user_id: number;

  @Column()
  campaign_id: number;

  @Column({ nullable: true })
  donation_id: number;

  @Column()
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  transaction_id: string;

  @ManyToOne(() => BeneficiaryCampaigns, (bc) => bc.distributions)
  @JoinColumn({ name: 'beneficiary_campaign_id' })
  beneficiaryCampaign: BeneficiaryCampaigns;

  @ManyToOne(() => Donation, (donation) => donation.distributions, {
    nullable: true,
  })
  @JoinColumn({ name: 'donation_id' })
  donation: Donation;
}
