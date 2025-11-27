import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateTargetBeneficiaryDto } from '../dto/create-target-beneficiaries.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import RolesGuard from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { UpdateTargetBeneficiaryDto } from '../dto/update-target-beneficiaries.dto';
import { TargetBeneficiariesService } from '../services/target-beneficiary.service';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiBearerAuth()
@ApiTags('Target Beneficiaries')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.ORGANIZER)
@Controller('target-beneficiaries')
export class TargetBeneficiariesController {
  constructor(
    private readonly targetBeneficiariesService: TargetBeneficiariesService,
  ) {}

  @Post()
  create(@Body() createTargetBeneficiaryDto: CreateTargetBeneficiaryDto) {
    return this.targetBeneficiariesService.create(createTargetBeneficiaryDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.USER)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.targetBeneficiariesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.targetBeneficiariesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTargetBeneficiaryDto: UpdateTargetBeneficiaryDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.targetBeneficiariesService.update(
      +id,
      updateTargetBeneficiaryDto,
      user.id,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.targetBeneficiariesService.remove(+id, user.id);
  }
}
