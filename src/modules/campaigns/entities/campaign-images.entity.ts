import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Campaigns } from './campaign.entity';

@Entity('campaign_images')
export class CampaignImages extends AbstractEntity<CampaignImages> {
  @Column()
  id: number;

  @Column()
  campaign_id: number;

  @Column()
  path: string;

  @ManyToOne(() => Campaigns, (campaign) => campaign.campaignImages)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaigns;
}
