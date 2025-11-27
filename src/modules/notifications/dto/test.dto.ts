import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TestNotificationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty()
  details: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  arabic_title: string;

  @IsString()
  @ApiProperty()
  arabic_details: string;

  @IsNumber()
  @ApiProperty()
  transaction_id: number;
}
