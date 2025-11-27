import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateWithdrawDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment: string;
}
