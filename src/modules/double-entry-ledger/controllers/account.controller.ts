import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { TransactionService } from '../services/transaction.service';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';

@ApiTags('ledger')
@ApiBearerAuth()
@Controller('ledger/accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  @Get('balance')
  getBalance(@UserIdentity() user: IUserIdentity): Promise<any> {
    return this.accountService.getBalance(user.id);
  }

  @Post('updateAllBalancesJob')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  updateAllBalancesJob(): Promise<void> {
    return this.transactionService.updateAllBalancesJob();
  }

  @Post('systemAccounts')
  @Roles(Role.ADMIN)
  systemAccounts() {
    return this.accountService.getSystemAccounts();
  }
}
