import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsMobilePhone,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateBeneficiaryDto } from '../../users/dto/create-beneficiary.dto';

export class CreateBeneficiaryCampaignDto {
  @ApiProperty()
  @IsInt()
  campaign_id: number;

  @ApiProperty()
  @IsMobilePhone()
  phone_number: string;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBeneficiaryDto)
  createBeneficiaryDto: CreateBeneficiaryDto;
}
