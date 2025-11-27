import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import RolesGuard from 'src/common/guards/roles.guard';
import { BeneficiaryCampaignsService } from '../services/beneficiary-campaigns.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { CreateBeneficiaryCampaignDto } from '../dto/create-beneficiary-campaigns.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DeleteBeneficiaryDto } from '../dto/delete-beneficiary.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from '@e965/xlsx';
import { AddBeneficiariesExcel } from '../dto/upload-excel.dto';
import { AddBeneficiaryCampaignDto } from '../dto/add-beneficiaries-campaign.dto';

@ApiBearerAuth()
@ApiTags('Campaigns')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.ORGANIZER)
@Controller('beneficiary-campaigns')
export class BeneficiaryCampaignsController {
  constructor(
    private readonly beneficiaryCampaignsService: BeneficiaryCampaignsService,
  ) {}

  @Post('connect-beneficiaries')
  addBeneficiaries(
    @UserIdentity() user: IUserIdentity,
    @Body() addBeneficiaryCampaignDto: AddBeneficiaryCampaignDto,
  ) {
    return this.beneficiaryCampaignsService.addBeneficiariesToCampaign(
      user,
      addBeneficiaryCampaignDto,
    );
  }

  @Post('add-beneficiary')
  createBeneficiary(
    @UserIdentity() user: IUserIdentity,
    @Body() createBeneficiaryCampaignDto: CreateBeneficiaryCampaignDto,
  ) {
    return this.beneficiaryCampaignsService.createOne(
      user,
      createBeneficiaryCampaignDto,
    );
  }

  @Post('add-beneficiaries')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadExcel(
    @Body() addBeneficiariesExcel: AddBeneficiariesExcel,
    @UploadedFile() file: Express.Multer.File,
    @UserIdentity() user: IUserIdentity,
  ) {
    if (!file) {
      throw new BadRequestException('file should not be empty');
    }
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    return this.beneficiaryCampaignsService.createManyFromExcel(
      data,
      addBeneficiariesExcel.campaign_id,
      user,
    );
  }

  @Get('get-beneficiaries')
  getAll(
    @UserIdentity() user: IUserIdentity,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.beneficiaryCampaignsService.getBeneficiaries(
      user,
      paginationDto,
    );
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.USER)
  @Get('get-campaign-beneficiaries/:id')
  getOne(
    @Param('id') campaignId: string,
    @UserIdentity() user: IUserIdentity,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.beneficiaryCampaignsService.getCampaignBeneficiaries(
      Number(campaignId),
      user,
      paginationDto,
    );
  }

  @Post('remove-beneficiaries-from-campaign')
  delete(
    @Body() deleteBeneficiary: DeleteBeneficiaryDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.beneficiaryCampaignsService.removeBeneficiary(
      deleteBeneficiary,
      user,
    );
  }
}
