import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class Cities extends AbstractEntity<Cities> {
  @Column()
  id: number;

  @Column()
  name: string;
}
