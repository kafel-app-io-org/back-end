import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CryptoDto {
  @ApiProperty()
  @IsString()
  wallet_address: string;
}
