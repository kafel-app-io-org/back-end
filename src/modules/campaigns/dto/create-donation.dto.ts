import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  campaign_id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
