import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from 'src/common/enum/user-status.enum';

export class UpdateBeneficiaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  birth_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  national_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  health_status?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: 'Status must be one of: active, suspended',
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: any;
}
