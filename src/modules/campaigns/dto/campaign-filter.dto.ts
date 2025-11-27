import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CampaignFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

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

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ description: 'Minimum number of beneficiaries' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  minBeneficiaries?: number;

  @ApiPropertyOptional({ description: 'Maximum number of beneficiaries' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  maxBeneficiaries?: number;

  @ApiPropertyOptional({ description: 'Minimum target amount' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  minTarget?: number;

  @ApiPropertyOptional({ description: 'Maximum target amount' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  maxTarget?: number;

  @ApiPropertyOptional({ description: 'One-time campaigns' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isOneTime?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  fromDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  toDate?: Date;
}
