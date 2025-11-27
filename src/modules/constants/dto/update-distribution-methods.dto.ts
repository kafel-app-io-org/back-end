import { PartialType } from '@nestjs/mapped-types';
import { CreateDistributionMethodsDto } from './create-distribution-methods.dto';

export class UpdateDistributionMethodsDto extends PartialType(
  CreateDistributionMethodsDto,
) {}
