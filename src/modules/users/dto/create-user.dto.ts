import {
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Role } from '../../../common/enum/role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from 'src/common/enum/user-status.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsMobilePhone()
  phone_number: string;

  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsEnum(UserStatus, {
    message: 'Status must be one of: active, suspended',
  })
  status: UserStatus;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  notes: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty()
  @IsEnum(Role, {
    message: 'Role must be one of: admin, user, organizer',
  })
  role: Role;
}
