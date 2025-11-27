import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { Role } from 'src/common/enum/role.enum';
import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Account } from '../../double-entry-ledger/entities/account.entity';
import { BeneficiaryCampaigns } from 'src/modules/campaigns/entities/beneficiary-campaigns.entity';
import { Campaigns } from '../../campaigns/entities/campaign.entity';
import { Notifications } from 'src/modules/notifications/entities/notifications.entity';
import { Withdraw } from 'src/modules/withdrawal/entities/withdraw.entity';
import { Images } from 'src/modules/users/entities/images.entity';
import { Donation } from 'src/modules/campaigns/entities/donation.entity';

@Entity()
export class Users extends AbstractEntity<Users> {
  @Column()
  id: number;

  @Column()
  name: string;

  @Column()
  password?: string;

  @Column({ unique: true })
  phone_number: string;

  @Column()
  status: string;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column()
  email: string;

  @Column()
  notes: string;

  @Column()
  address: string;

  @Column()
  image: string;

  @Column()
  birth_date?: Date;

  @Column()
  national_id?: string;

  @Column()
  health_status?: string;

  @Column()
  video_url: string;

  @Column()
  website?: string;

  @Column()
  icon?: string;

  @Column()
  overview?: string;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: string;

  @Column()
  withdraw_method_preference: string;

  @Column({ default: false })
  is_beneficiary: boolean;

  @OneToMany(() => Account, (account) => account.user, { cascade: true })
  accounts: Account[];

  @OneToMany(() => Campaigns, (campaign) => campaign.organizer)
  campaigns: Campaigns[];

  @OneToMany(() => BeneficiaryCampaigns, (uc) => uc.user)
  beneficiaryCampaigns: BeneficiaryCampaigns[];

  @OneToMany(() => Notifications, (notification) => notification.user, {
    cascade: true,
  })
  notifications: Notifications[];

  @OneToMany(() => Withdraw, (withdraw) => withdraw.user, { cascade: true })
  withdraws: Withdraw[];

  @OneToMany(() => Images, (image) => image.user)
  images: Images[];

  @OneToMany(() => Donation, (donation) => donation.user)
  donation: Donation[];
}
