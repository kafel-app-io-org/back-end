import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsString()
  idToken: string;
}

export class LoginDto {
  @ApiProperty()
  @IsString()
  phone_number: string;

  @ApiProperty()
  @IsString()
  password: string;
}
