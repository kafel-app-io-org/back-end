import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTargetBeneficiaryDto {
  @ApiProperty()
  @IsString()
  name: string;
}
