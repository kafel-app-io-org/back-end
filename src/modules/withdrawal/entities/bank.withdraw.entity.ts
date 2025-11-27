import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Withdraw } from './withdraw.entity';

@Entity('bank_accounts')
export class BankAccount extends AbstractEntity<BankAccount> {
  @Column()
  user_id: number;

  @Column()
  country: string;

  @Column()
  bank: string;

  @Column()
  iban: string;

  @Column()
  swift_code: string;

  @OneToMany(() => Withdraw, (withdraw) => withdraw.cryptoAccount)
  withdraws: Withdraw[];
}
