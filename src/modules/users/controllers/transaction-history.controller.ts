import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';
import RolesGuard from '../../../common/guards/roles.guard';
import { TransactionHistoryService } from '../services/transaction-history.service';
import {
  TransactionCategory,
  TransactionHistoryFilterDto,
} from '../dto/transaction-history.dto';
 
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('transactions')
export class TransactionHistoryController {
  constructor(
    private readonly transactionHistoryService: TransactionHistoryService,
  ) {}

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  getTransactionHistory(
    @UserIdentity() user: IUserIdentity,
    @Query() filterDto: TransactionHistoryFilterDto,
  ) {
    return this.transactionHistoryService.getTransactionHistory(
      user.id,
      filterDto,
    );
  }
  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  getOneTransaction(
    @UserIdentity() user: IUserIdentity,
    @Param('id') id: string,
  ) {
    return this.transactionHistoryService.getOneTransaction(user.id, id);
  }

  @Get(':id/:category')
  @Roles(Role.USER, Role.ADMIN)
  getTransactionDetails(
    @UserIdentity() user: IUserIdentity,
    @Param('id', ParseIntPipe) id: number,
    @Param('category', new ParseEnumPipe(TransactionCategory))
    category: TransactionCategory,
  ) {
    return this.transactionHistoryService.getTransactionDetails(
      user.id,
      id,
      category,
    );
  }
}
