import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class DonationFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  country?: string[];

  @ApiPropertyOptional({
    description: 'Campaign name (deprecated, use campaignId instead)',
  })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({ description: 'Campaign ID for filtering' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    return [Number(value)];
  })
  @IsNumber({}, { each: true })
  campaignId?: number[];

  @ApiPropertyOptional({
    description: 'Organizer name (deprecated, use organizer_id instead)',
  })
  @IsOptional()
  @IsString()
  organizer?: string;

  @ApiPropertyOptional({ description: 'Organizer ID for filtering' })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    return [Number(value)];
  })
  @IsNumber({}, { each: true })
  organizer_id?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    return [Number(value)];
  })
  @IsNumber({}, { each: true })
  beneficiaryType?: number[];

  @ApiPropertyOptional({ description: 'Minimum fund amount' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum fund amount' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  fromDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  toDate?: Date;
}
