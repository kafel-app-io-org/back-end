import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty()
  @IsInt()
  user_id: number;

  @ApiProperty()
  @IsString()
  bank: string;

  @ApiProperty()
  @IsString()
  iban: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  swift_code: string;

  @ApiProperty()
  @IsString()
  card: string;

  @ApiProperty()
  @IsString()
  wallet_address: string;
}
