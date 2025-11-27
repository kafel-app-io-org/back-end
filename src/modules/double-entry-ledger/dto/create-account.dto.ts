import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsPositive,
} from 'class-validator';
import {
  AccountType,
  AccountStatus,
  NormalBalanceType,
} from '../entities/account.entity';

export class CreateAccountDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  account_number?: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsBoolean()
  @IsOptional()
  is_contra_account?: boolean;

  @IsEnum(NormalBalanceType)
  normal_balance: string;

  @IsNumber()
  @IsPositive()
  parent_account_id?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  metadata?: string;

  user_id?: number;

  campaign_id?: number;
}
