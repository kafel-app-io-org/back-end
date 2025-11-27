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
import { CitiesService } from '../services/cities.service';
import { CreateCitiesDto } from '../dto/create-cities.dto';
import { UpdateCitiesDto } from '../dto/update-cities.dto';

@ApiBearerAuth()
@ApiTags('Constants')
@UseGuards(RolesGuard)
@Controller('cities')
@Roles(Role.ADMIN)
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  create(
    @Body() createDto: CreateCitiesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.citiesService.create(createDto, user.id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.citiesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCitiesDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.citiesService.update(+id, updateDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.citiesService.remove(+id, user.id);
  }
}
