import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateBeneficiaryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsPhoneNumber()
  phone_number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  birth_date: Date;

  @ApiProperty()
  @IsString()
  national_id: string;

  @ApiProperty()
  @IsString()
  health_status: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: any;
}
