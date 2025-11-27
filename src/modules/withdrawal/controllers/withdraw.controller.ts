import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WithdrawService } from '../services/withdraw.service';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';
import { CreateWithdrawDto } from '../dto/create-withdraw.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('withdraw')
@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Roles(Role.USER, Role.ADMIN)
  @Get('accounts')
  getAccounts(@UserIdentity() user: IUserIdentity) {
    return this.withdrawService.getAccounts(user.id);
  }

  @Roles(Role.ADMIN)
  @Post('confirm-withdrawal/:withdraw_id')
  confirm(@Param('withdraw_id') withdraw_id: number) {
    return this.withdrawService.confirmWithdrawal(withdraw_id);
  }

  @Roles(Role.ADMIN)
  @Post('decline-withdrawal/:withdraw_id')
  decline(@Param('withdraw_id') withdraw_id: number) {
    return this.withdrawService.declineWithdrawal(withdraw_id);
  }

  @Roles(Role.ADMIN)
  @Get('pending-confirmation')
  pending(@Query() paginationDto: PaginationDto) {
    return this.withdrawService.getPendingConfirmation(paginationDto);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('history')
  getHistory(
    @UserIdentity() user: IUserIdentity,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.withdrawService.getUserWithdraws(user, paginationDto);
  }

  @Roles(Role.ADMIN)
  @Get('all')
  getAll(@Query() paginationDto: PaginationDto) {
    return this.withdrawService.getAllWithdraws(paginationDto);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Post()
  create(@UserIdentity() user: IUserIdentity, @Body() dto: CreateWithdrawDto) {
    return this.withdrawService.create(user.id, dto);
  }
}
