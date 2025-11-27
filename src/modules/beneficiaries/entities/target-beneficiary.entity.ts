import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity, OneToMany } from 'typeorm';
import { Campaigns } from '../../campaigns/entities/campaign.entity';

@Entity()
export class TargetBeneficiariesType extends AbstractEntity<TargetBeneficiariesType> {
  @Column()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Campaigns, (campaign) => campaign.targetBeneficiaries)
  campaigns: Campaigns[];
}
