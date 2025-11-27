import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 18, scale: 2 })
  amount: string; // use string for decimal in TS

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
