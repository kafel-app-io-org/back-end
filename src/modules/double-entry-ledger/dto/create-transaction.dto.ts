import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TransactionStatus } from '../entities/transaction.entity';
import { CreateEntryDto } from './create-entry.dto';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  transaction_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  transaction_date: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  external_id?: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];
}
