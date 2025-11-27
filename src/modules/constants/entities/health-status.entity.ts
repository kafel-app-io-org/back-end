import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class HealthStatus extends AbstractEntity<HealthStatus> {
  @Column()
  id: number;

  @Column()
  name: string;
}
