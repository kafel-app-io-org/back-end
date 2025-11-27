import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class MarkAsReadDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  notification_id: number;
}
