import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
}

export class PaymentRequestDto {
  @ApiProperty() @IsInt() payerUserId: number;
  @ApiProperty() @IsInt() receiverUserId: number;

  @ApiProperty() @IsString() @IsNotEmpty() payerDeviceFingerprint: string;
  @ApiProperty() @IsString() @IsNotEmpty() receiverDeviceFingerprint: string;

  @ApiProperty() @IsUUID() nonce: string;       // must match one of the 20 tokens
  @ApiProperty() @IsInt() ctr: number;          // payer device monotonic counter
  @ApiProperty() @IsInt() amountMinor: number;  // 3-dec USDT minor units
  @ApiProperty() @IsString() currency: string;  // "KFL"

  // base64(Ed25519 signature over canonical JSON: {nonce, ctr, amountMinor, currency, receiverUserId})
  @ApiProperty() @IsString() @IsNotEmpty()
  signatureB64: string;
}
