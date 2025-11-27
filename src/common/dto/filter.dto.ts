import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  toDate?: Date;
}

export class AmountRangeDto {
  @ApiPropertyOptional({ description: 'Minimum amount for filtering' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount for filtering' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  maxAmount?: number;
}
