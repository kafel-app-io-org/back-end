import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class Locations extends AbstractEntity<Locations> {
  @Column()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;
}
