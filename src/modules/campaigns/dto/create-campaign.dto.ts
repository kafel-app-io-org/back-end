import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CampaignStatus } from 'src/common/enum/campaign-status.enum';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  organizer_id?: number;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsDateString()
  start_date: Date;

  @ApiProperty()
  @IsDateString()
  end_date: Date;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  target_beneficiaries_id: number;

  @ApiProperty()
  @IsString()
  details: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  video_url?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  image: any;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  single_target: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  num_beneficiaries: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(CampaignStatus, {
    message: 'Status must be one of: active, inactive, draft, suspended',
  })
  status?: CampaignStatus;

  // @ApiPropertyOptional({
  //   type: 'string',
  //   format: 'binary',
  // })
  // @IsOptional()
  // campaign_images?: any[];
}
