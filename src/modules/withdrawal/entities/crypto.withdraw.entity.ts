import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.model';
import { Withdraw } from './withdraw.entity';

@Entity('crypto_accounts')
export class CryptoAccount extends AbstractEntity<CryptoAccount> {
  @Column()
  user_id: number;

  @Column()
  wallet_address: string;

  @OneToMany(() => Withdraw, (withdraw) => withdraw.cryptoAccount)
  withdraws: Withdraw[];
}
