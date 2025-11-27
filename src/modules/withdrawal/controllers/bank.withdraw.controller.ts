import { Body, Controller, Post } from '@nestjs/common';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BankWithdrawService } from '../services/bank.withdraw.service';
import { BankDto } from '../dto/bank.dto';

@ApiBearerAuth()
@Controller('withdraw/accounts/bank')
@ApiTags('withdraw')
export class BankWithdrawController {
  constructor(private readonly bankWithdrawService: BankWithdrawService) {}

  @Post()
  createOrUpdate(@UserIdentity() user: IUserIdentity, @Body() dto: BankDto) {
    return this.bankWithdrawService.createOrUpdate(user.id, dto);
  }
}
