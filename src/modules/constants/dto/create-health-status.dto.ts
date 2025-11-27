import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHealthStatusDto {
  @ApiProperty()
  @IsString()
  name: string;
}
