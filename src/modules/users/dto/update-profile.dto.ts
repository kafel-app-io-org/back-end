import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsMobilePhone, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @IsString()
  email: string;

  @ApiPropertyOptional()
  @IsMobilePhone()
  phone_number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional() // by RSR
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional() // by RSR
  city: string;

  @ApiPropertyOptional()
  @IsOptional() // by RSR
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional() // by RSR
  @IsString()
  overview?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: any;
}
