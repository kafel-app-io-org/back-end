import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';

@Entity()
export class Withdrawals extends AbstractEntity<Withdrawals> {
  @Column()
  id: number;

  @Column()
  user_id: number;

  @Column()
  bank: string;

  @Column()
  iban: string;

  @Column()
  country: string;

  @Column()
  swift_code: string;

  @Column()
  card: string;

  @Column()
  wallet_address: string;
}
