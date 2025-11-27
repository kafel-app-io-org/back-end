import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from 'src/common/enum/campaign-status.enum';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizer_id?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  country?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  details?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  video_url?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  method?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @ApiPropertyOptional()
  target_beneficiaries_id?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsInt()
  @ApiPropertyOptional()
  num_beneficiaries?: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  // 👇 This is for Swagger docs only; image is handled by interceptor, not class-validator
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  image?: any;

  // @ApiPropertyOptional({
  //   type: 'string',
  //   format: 'binary',
  // })
  // @IsOptional()
  // campaign_images?: any[];
}
