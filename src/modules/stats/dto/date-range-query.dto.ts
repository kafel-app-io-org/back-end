import { IsISO8601, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string; // ISO date string

  @IsOptional()
  @IsISO8601()
  to?: string;   // ISO date string
}
