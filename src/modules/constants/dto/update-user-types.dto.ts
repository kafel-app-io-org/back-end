import { PartialType } from '@nestjs/mapped-types';
import { CreateUserTypesDto } from './create-user-types.dto';

export class UpdateUserTypesDto extends PartialType(CreateUserTypesDto) {}
