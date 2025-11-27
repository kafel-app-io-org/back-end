import { Controller, Get, Body, Put, UseGuards, Param } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import RolesGuard from 'src/common/guards/roles.guard';
import { FeePercentageService } from '../services/fee-percentage.service';
import { UpdateFeePercentageDto } from '../dto/update-fee-percentage.dto';
import { Public } from '../../../common/decorator/public.decorator';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('fee-percentage')
export class FeePercentageController {
  constructor(private readonly feePercentageService: FeePercentageService) {}

  @Get()
  @Public()
  findAll() {
    return this.feePercentageService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.feePercentageService.findOne(+id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeePercentageDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.feePercentageService.update(+id, updateDto, user.id);
  }
}
