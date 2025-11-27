import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class DistributionMethods extends AbstractEntity<DistributionMethods> {
  @Column()
  id: number;

  @Column()
  name: string;
}
