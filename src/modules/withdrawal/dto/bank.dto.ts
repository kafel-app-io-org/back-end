import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BankDto {
  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  bank: string;

  @ApiProperty()
  @IsString()
  iban: string;

  @ApiProperty()
  @IsString()
  swift_code: string;
}
