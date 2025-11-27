import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class FeePercentage extends AbstractEntity<FeePercentage> {
  @Column()
  id: number;

  @Column()
  type: string;

  @Column()
  amount: number;
}
