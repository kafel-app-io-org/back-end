import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Token } from 'src/common/enum/token.enum';

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  txHash: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  expectedAmount: number;

  @ApiProperty()
  @IsEnum(Token, {
    message: 'token must be one of: USDT, USDC',
  })
  token: Token;
}
