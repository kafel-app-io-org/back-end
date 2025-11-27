import { ApiProperty } from '@nestjs/swagger';
import { MethodType } from '../../withdrawal/entities/withdraw.entity';
import { IsEnum } from 'class-validator';

export class ChangeWithdrawPreferenceDto {
  @ApiProperty({ enum: MethodType })
  @IsEnum(MethodType)
  method: MethodType;
}
