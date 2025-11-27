import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'; 

export class CreateTransferDto {
  @ApiProperty()
  @IsString()
  receiver_phone_number: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment: string;

  // New fields for token + signing
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature: string;      // hex HMAC

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expires_at?: string;    // ISO string
}
