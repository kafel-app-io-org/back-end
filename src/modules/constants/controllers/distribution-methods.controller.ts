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
import { DistributionMethodsService } from '../services/distribution-methods.service';
import { CreateDistributionMethodsDto } from '../dto/create-distribution-methods.dto';
import { UpdateDistributionMethodsDto } from '../dto/update-distribution-methods.dto';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('distribution-methods')
@Roles(Role.ADMIN)
export class DistributionMethodsController {
  constructor(
    private readonly distributionMethodsService: DistributionMethodsService,
  ) {}

  @Post()
  create(
    @Body() createDto: CreateDistributionMethodsDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.distributionMethodsService.create(createDto, user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.distributionMethodsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.distributionMethodsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDistributionMethodsDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.distributionMethodsService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.distributionMethodsService.remove(+id, user.id);
  }
}
