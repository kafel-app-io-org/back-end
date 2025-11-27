import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import type { TransactionService } from '../services/transaction.service';
import type { Transaction } from '../entities/transaction.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Role } from '../../../common/enum/role.enum';
import { Roles } from '../../../common/decorator/roles.decorator';

@ApiTags('ledger')
@ApiBearerAuth()
@Controller('ledger/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<Transaction[]> {
    return this.transactionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionService.findOne(+id);
  }

  @Get('number/:transaction_number')
  findByNumber(
    @Param('transaction_number') transaction_number: string,
  ): Promise<Transaction> {
    return this.transactionService.findByNumber(transaction_number);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  postTransaction(@Param('id') id: string): Promise<Transaction> {
    return this.transactionService.postTransaction(+id);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  voidTransaction(@Param('id') id: string): Promise<Transaction> {
    return this.transactionService.voidTransaction(+id);
  }
}
