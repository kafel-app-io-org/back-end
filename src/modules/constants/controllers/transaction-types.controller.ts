import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import RolesGuard from 'src/common/guards/roles.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TransactionTypesService } from '../services/transaction-types.service';
import { CreateTransactionTypesDto } from '../dto/create-transaction-types.dto';
import { UpdateTransactionTypesDto } from '../dto/update-transaction-types.dto';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('transaction-types')
@Roles(Role.ADMIN)
export class TransactionTypesController {
  constructor(
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  @Post()
  create(
    @Body() createDto: CreateTransactionTypesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.transactionTypesService.create(createDto, user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.transactionTypesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionTypesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionTypesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.transactionTypesService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.transactionTypesService.remove(+id, user.id);
  }
}
