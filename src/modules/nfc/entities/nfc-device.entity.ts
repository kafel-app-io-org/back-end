import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Users } from 'src/modules/users/entities/users.entity';

@Entity('nfc_devices')
export class NfcDevice extends AbstractEntity<NfcDevice> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, { eager: true })
  owner: Users;

  @Column()
  device_fingerprint: string;

  @Column({ type: 'text' })
  public_key_pem: string; // Ed25519 SPKI/PEM

  @Column({ default: 0 })
  signing_counter: number;

  @Column({ default: true })
  active: boolean;
}
