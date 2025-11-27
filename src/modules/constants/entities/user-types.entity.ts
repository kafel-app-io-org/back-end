import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class UserTypes extends AbstractEntity<UserTypes> {
  @Column()
  id: number;

  @Column()
  name: string;
}
