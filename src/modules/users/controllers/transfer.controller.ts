import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { TransferService } from '../services/transfer.service';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import RolesGuard from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransferFilterDto } from '../dto/transfer-filter.dto';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@UserIdentity() user: IUserIdentity, @Body() dto: CreateTransferDto) {
    return this.transferService.create(user, dto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  getTransfers(
    @UserIdentity() user: IUserIdentity,
    @Query() filterDto: TransferFilterDto,
  ) {
    return this.transferService.getTransfers(user.id, filterDto);
  }
}
