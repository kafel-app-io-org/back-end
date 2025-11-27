// src/modules/campaigns/controllers/campaigns.controller.ts
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
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  UploadedFile,
  Res
} from '@nestjs/common';
import { CampaignsService } from '../services/campaigns.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import RolesGuard from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorator/roles.decorator';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { BeneficiaryDistributionService } from '../services/beneficiary-distribution.service';
import { CampaignFilterDto } from '../dto/campaign-filter.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

// ⬇️ add this import (point to where you created it)
import { Public } from '../../auth/public.decorator'; // adjust relative path if needed

import { Response } from 'express';

@ApiBearerAuth()
@ApiTags('Campaigns')
// keep plural controller for existing routes
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly beneficiaryDistributionService: BeneficiaryDistributionService,
  ) {}

  // ---------- PUBLIC READ ENDPOINTS ----------

  @Public()
  @Get()
  findAll(
    @Query() filterDto: CampaignFilterDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.campaignsService.findAll(filterDto, user);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(+id);
  }

  @Public()
  @Get('campaign-images/:campaign_id')
  campaignImages(
    @Param('campaign_id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.campaignsService.getCampaignImages(+id, paginationDto);
  }

  // ---------- PROTECTED WRITE/ADMIN ENDPOINTS ----------

  @Post()
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      // { name: 'campaign_images', maxCount: 10 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  create(
    @UserIdentity() user: IUserIdentity,
    @Body() createCampaignDto: CreateCampaignDto,
    @UploadedFiles()
    files: {
      // campaign_images?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    const { image } = files;
    return this.campaignsService.create(
      user,
      createCampaignDto,
      image?.[0],
      // campaign_images || [],
    );
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      // { name: 'campaign_images', maxCount: 10 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @UserIdentity() user: IUserIdentity,
    @UploadedFiles()
    files: {
      // campaign_images?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ) {
    const { image } = files;
    return this.campaignsService.update(
      +id,
      updateCampaignDto,
      user,
      image?.[0] || null,
      // campaign_images || [],
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.campaignsService.remove(+id, user);
  }

  @Post(':id/distribute')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  distributeCampaignFunds(@Param('id') id: number) {
    return this.beneficiaryDistributionService.distributeCampaignFunds(id);
  }

  @Post(':campaignId/images')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiParam({ name: 'campaignId', type: Number, description: 'Campaign ID' })
  async uploadCampaignImage(
    @UserIdentity() user: IUserIdentity,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.campaignsService.uploadCampaignImages(user, campaignId, file);
  }

  @Delete(':campaignId/images/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiParam({ name: 'campaignId', type: Number, description: 'Campaign ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Image ID to delete' })
  async deleteCampaignImage(
    @UserIdentity() user: IUserIdentity,
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Param('id', ParseIntPipe) imageId: number,
  ) {
    return this.campaignsService.deleteCampaignImage(user, campaignId, imageId);
  }
}

/**
 * ✅ New alias controller to support:
 * GET /campaign/link/:id
 */
@ApiTags('Campaigns')
@Public()
@Controller('campaign')
export class CampaignsLinkController {
  @Get('link/:id')
  openInApp(@Param('id') id: string, @Res() res: Response) {
    const html = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
					<script>
					  (function () {
						var scheme = 'kafelapp://campaign/link/${id}';
						// Try to open the app
						window.location.href = scheme;
						// Fallback (after ~1s) if app isn't installed: stay here or redirect to your store page
						setTimeout(function () {
						  // window.location.href = 'https://play.google.com/store/apps/details?id=com.company.kafelapp';
						}, 1200);
					  })();
					</script>
					<body style="font-family:system-ui;padding:24px">Opening Kafel…</body>`;
    res.type('html').send(html); // sets Content-Type: text/html and sends it
  }
}