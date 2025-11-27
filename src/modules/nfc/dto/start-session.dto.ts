import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty() @IsString()
  receiver_phone_number: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  deviceFingerprint: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  publicKeyPem: string; // Ed25519 public key (PEM/SPKI)
}
