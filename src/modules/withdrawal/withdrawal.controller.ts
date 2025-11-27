import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import RolesGuard from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('Withdrawal Data')
@UseGuards(RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  create(@Body() createWithdrawalDto: CreateWithdrawalDto) {
    return this.withdrawalService.create(createWithdrawalDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.withdrawalService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.withdrawalService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateWithdrawalDto: UpdateWithdrawalDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.withdrawalService.update(+id, updateWithdrawalDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.withdrawalService.remove(+id, user.id);
  }
}
