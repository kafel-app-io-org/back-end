import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { EntryType } from '../entities/entry.entity';

export class CreateEntryDto {
  @IsNumber()
  @IsPositive()
  account_id: number;

  @IsEnum(EntryType)
  type: EntryType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
