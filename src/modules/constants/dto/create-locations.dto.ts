import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationsDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;
}
