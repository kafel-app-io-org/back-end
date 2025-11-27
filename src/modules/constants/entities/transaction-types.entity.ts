import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class TransactionTypes extends AbstractEntity<TransactionTypes> {
  @Column()
  id: number;

  @Column()
  name: string;
}
