import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { CreateDonationDto } from '../dto/create-donation.dto';
import { DonationService } from '../services/donation.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import RolesGuard from '../../../common/guards/roles.guard';
import { Role } from '../../../common/enum/role.enum';
import { Roles } from '../../../common/decorator/roles.decorator';
import { DonationFilterDto } from '../dto/donation-filter.dto';

@ApiTags('donations')
@ApiBearerAuth()
@Controller('/donations')
@UseGuards(RolesGuard)
@Roles(Role.USER, Role.ADMIN)
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  createDonation(
    @UserIdentity() user: IUserIdentity,
    @Body() createDonationDto: CreateDonationDto,
  ) {
    return this.donationService.createDonation(user, createDonationDto);
  }

  @Get()
  getAll(
    @UserIdentity() user: IUserIdentity,
    @Query() filterDto: DonationFilterDto,
  ) {
    return this.donationService.getDonations(user, filterDto);
  }

  @Get(':id/distributions')
  @ApiOperation({
    summary: 'Get beneficiaries that received funds from a donation',
    description:
      'Returns detailed information about which beneficiaries received funds from a specific donation',
  })
  @ApiParam({ name: 'id', description: 'The donation ID' })
  @ApiResponse({
    status: 200,
    description: 'The list of distributions with beneficiary details',
  })
  @ApiResponse({
    status: 400,
    description: 'Donation not found or does not belong to the user',
  })
  getDonationWithDistributions(@Param('id') id: number) {
    return this.donationService.getDonationWithDistributions(id);
  }
}
