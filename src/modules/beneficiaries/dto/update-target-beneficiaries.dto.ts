import { PartialType } from '@nestjs/mapped-types';
import { CreateTargetBeneficiaryDto } from './create-target-beneficiaries.dto';

export class UpdateTargetBeneficiaryDto extends PartialType(
  CreateTargetBeneficiaryDto,
) {}
