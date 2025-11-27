import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionTypesDto } from './create-transaction-types.dto';

export class UpdateTransactionTypesDto extends PartialType(
  CreateTransactionTypesDto,
) {}
