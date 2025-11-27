import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCitiesDto {
  @ApiProperty()
  @IsString()
  name: string;
}
