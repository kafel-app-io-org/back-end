import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Users } from 'src/modules/users/entities/users.entity';

@Entity('images')
export class Images extends AbstractEntity<Images> {
  @Column()
  id: number;

  @Column()
  user_id: number;

  @Column()
  path: string;

  @ManyToOne(() => Users, (user) => user.images)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
