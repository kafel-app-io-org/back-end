import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserTypesDto {
  @ApiProperty()
  @IsString()
  name: string;
}
