import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { BeneficiaryService } from '../services/beneficiary.service';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';
import RolesGuard from '../../../common/guards/roles.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createBeneficiaryDto: CreateBeneficiaryDto,
    @UserIdentity() user: IUserIdentity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.beneficiaryService.createBeneficiary(
      createBeneficiaryDto,
      user.id,
      file,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  find(@Param('id') id: number) {
    return this.beneficiaryService.findOne(id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORGANIZER)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.beneficiaryService.findAll(paginationDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateBeneficiaryDto: UpdateBeneficiaryDto,
    @UserIdentity() user: IUserIdentity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.beneficiaryService.update(
      +id,
      updateBeneficiaryDto,
      user,
      file,
    );
  }
}
