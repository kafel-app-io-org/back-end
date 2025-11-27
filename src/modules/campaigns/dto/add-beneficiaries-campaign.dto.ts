import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber } from 'class-validator';

export class AddBeneficiaryCampaignDto {
  @ApiProperty()
  @IsInt()
  campaign_id: number;

  @ApiProperty({
    type: [Number],
    isArray: true,
    example: [1, 2, 3],
    description: 'Array of user IDs',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  user_ids: number[];
}
