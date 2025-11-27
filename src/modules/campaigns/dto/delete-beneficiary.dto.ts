import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteBeneficiaryDto {
  @ApiProperty()
  @IsNumber()
  campaign_id: number;

  @ApiProperty({
    type: [Number],
    isArray: true,
    example: [1, 2, 3],
    description: 'Array of beneficiary IDs to remove',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  beneficiary_ids: number[];
}
