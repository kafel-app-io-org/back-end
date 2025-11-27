import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import RolesGuard from 'src/common/guards/roles.guard';
import { CountriesDialCodeService } from '../services/countries-dial-code.service';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('countries-dial-code')
@Roles(Role.ADMIN, Role.ORGANIZER, Role.USER)
export class CountriesDialCodeController {
  constructor(
    private readonly countriesDialCodeService: CountriesDialCodeService,
  ) {}

  @Get()
  findAll() {
    return this.countriesDialCodeService.findAll();
  }
}
