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
import { UserTypesService } from '../services/user-types.service';
import { UpdateUserTypesDto } from '../dto/update-user-types.dto';
import { CreateUserTypesDto } from '../dto/create-user-types.dto';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('user-types')
@Roles(Role.ADMIN)
export class UserTypesController {
  constructor(private readonly userTypesService: UserTypesService) {}

  @Post()
  create(
    @Body() createDto: CreateUserTypesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.userTypesService.create(createDto, user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userTypesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userTypesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserTypesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.userTypesService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.userTypesService.remove(+id, user.id);
  }
}
