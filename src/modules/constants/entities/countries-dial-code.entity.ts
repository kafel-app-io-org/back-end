import { AbstractEntity } from 'src/common/entities/abstract.model';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CountriesDialCode extends AbstractEntity<CountriesDialCode> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dial_code: string;

  @Column()
  iso_code: string;

  @Column({ nullable: true })
  flag: string;
}
