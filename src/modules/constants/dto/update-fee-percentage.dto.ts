import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateFeePercentageDto {
  @ApiProperty()
  @IsNumber()
  amount: number;
}
