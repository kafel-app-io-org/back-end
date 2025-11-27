import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionTypesDto {
  @ApiProperty()
  @IsString()
  name: string;
}
