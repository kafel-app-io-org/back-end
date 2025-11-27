import { AbstractEntity } from 'src/common/entities/abstract.model';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from '../../double-entry-ledger/entities/account.entity';
import { BeneficiaryCampaigns } from './beneficiary-campaigns.entity';
import { Users } from '../../users/entities/users.entity';
import { TargetBeneficiariesType } from '../../beneficiaries/entities/target-beneficiary.entity';
import { Donation } from './donation.entity';
import { CampaignImages } from './campaign-images.entity';

@Entity()
export class Campaigns extends AbstractEntity<Campaigns> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  organizer_id: number;

  @Column()
  address: string;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  method: string;

  @Column()
  target_beneficiaries_id: number;

  @Column()
  single_target: number;

  @Column()
  image: string;

  @Column()
  status: string;

  @Column()
  num_beneficiaries: number;

  @Column()
  total_collected: number;

  @Column()
  details: string;

  @Column()
  video_url: string;

  @OneToOne(() => Account, (account) => account.campaign, { cascade: true })
  account: Account;

  @ManyToOne(() => Users, (user) => user.campaigns)
  @JoinColumn({ name: 'organizer_id' })
  organizer: Users;

  @ManyToOne(() => TargetBeneficiariesType, (tb) => tb.campaigns)
  @JoinColumn({ name: 'target_beneficiaries_id' })
  targetBeneficiaries: TargetBeneficiariesType;

  get numberOfMonths(): number {
    if (this.method !== 'Monthly') {
      return 1;
    }
    if (!this.start_date || !this.end_date) {
      return 0;
    }
    if (new Date(this.end_date) < new Date(this.start_date)) {
      return 0;
    }
    return (
      (new Date(this.end_date).getFullYear() -
        new Date(this.start_date).getFullYear()) *
        12 +
      (new Date(this.end_date).getMonth() -
        new Date(this.start_date).getMonth())
    );
  }

  get totalTarget(): number {
    return this.single_target * this.num_beneficiaries * this.numberOfMonths;
  }

  static getVirtualColumns(campaign: Campaigns): any {
    const total_target = campaign.totalTarget;

    if (total_target === 0) {
      // return 0;
      return {
        progress: 0,
        total_target: 0,
        // by RSR account: {
        //   posted_balance: 0,
        //   available_balance: 0,
        //   total_collected: 0,
        // },
      };
    }
    return {
      progress: Math.floor(
        (campaign.total_collected / (total_target * 100)) * 100,
      ),
      total_target: Math.floor( total_target * 100),
      // by RSR account: {
      //   // posted_balance: campaign.total_collected,
      //   // available_balance: campaign.total_collected,
      //   // posted_balance: campaign.account
      //   // available_balance: campaign.account.available_balance,
      //   total_collected: campaign.total_collected, // By RSR
      // },
    };
  }

  @OneToMany(() => BeneficiaryCampaigns, (uc) => uc.campaign)
  beneficiaryCampaigns: BeneficiaryCampaigns[];

  @OneToMany(() => Donation, (donation) => donation.campaign)
  donations: Donation[];

  @OneToMany(() => CampaignImages, (campaignImages) => campaignImages.campaign)
  campaignImages: CampaignImages[];
}
