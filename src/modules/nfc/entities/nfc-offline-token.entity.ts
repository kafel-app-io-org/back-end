import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NfcDevice } from './nfc-device.entity';

@Entity('nfc_offline_tokens')
export class NfcOfflineToken extends AbstractEntity<NfcOfflineToken> {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NfcDevice, { eager: true })
  device: NfcDevice;

  @Index({ unique: true })
  @Column()
  nonce: string; // UUID v4

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at?: Date;
}
