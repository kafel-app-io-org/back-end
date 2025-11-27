import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDistributionMethodsDto {
  @ApiProperty()
  @IsString()
  name: string;
}
