import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  amount: number;
}
