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
import { HealthStatusService } from '../services/health-status.service';
import { UpdateHealthStatusDto } from '../dto/update-health-status.dto';
import { CreateHealthStatusDto } from '../dto/create-health-status.dto';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('health-status')
@Roles(Role.ADMIN)
export class HealthStatusController {
  constructor(private readonly healthStatusService: HealthStatusService) {}

  @Post()
  create(
    @Body() createDto: CreateHealthStatusDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.healthStatusService.create(createDto, user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.healthStatusService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthStatusService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHealthStatusDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.healthStatusService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.healthStatusService.remove(+id, user.id);
  }
}
