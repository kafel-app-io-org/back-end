import { Injectable } from '@nestjs/common';
import { IUserIdentity } from './common/interfaces/user-identity.interface';
import { CampaignsService } from './modules/campaigns/services/campaigns.service';
import { AccountService } from './modules/double-entry-ledger/services/account.service';
import { UsersService } from './modules/users/services/users.service';
import { TransactionHistoryService } from './modules/users/services/transaction-history.service';
import { TransactionCategory } from './modules/users/dto/transaction-history.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly campaignService: CampaignsService,
    private readonly accountService: AccountService,
    private readonly transactionHistoryService: TransactionHistoryService,
    private readonly userService: UsersService,
  ) {}

  async getLandingPage(user: IUserIdentity) {
    const [balance, latestCampaigns, latestTransfers, profile] =
      await Promise.all([
        this.accountService.getBalance(user.id),
        this.campaignService.latestCampaigns(),
        this.transactionHistoryService.getTransactionHistory(user.id, {
          category: TransactionCategory.ALL,
          limit: 2,
          offset: 0,
          page: 1,
        }),
        this.userService.getProfile(user.id),
      ]);
    return {
      balance,
      latestCampaigns,
      latestTransfers: latestTransfers.slice(0, 2),
      profile,
    };
  }

  getHello(): string {
    return 'Hello World2!';
  }
}
