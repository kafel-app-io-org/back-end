import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import RolesGuard from 'src/common/guards/roles.guard';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { BeneficiaryDistributionService } from '../services/beneficiary-distribution.service';

@ApiTags('beneficiary-distributions')
@ApiBearerAuth()
@Controller('/beneficiary-distributions')
@UseGuards(RolesGuard)
export class BeneficiaryDistributionsController {
  constructor(
    private readonly distributionService: BeneficiaryDistributionService,
  ) {}

  @Get('my-distributions')
  @Roles(Role.USER, Role.ADMIN)
  getMyDistributions(@UserIdentity() user: IUserIdentity) {
    return this.distributionService.getDistributionsByBeneficiary(user.id);
  }
}
