import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CampaignsService } from './services/campaigns.service';
import { DonationService } from './services/donation.service';
import { BeneficiaryCampaignsService } from './services/beneficiary-campaigns.service';
import { BeneficiaryDistributionService } from './services/beneficiary-distribution.service';

import { CampaignsController, CampaignsLinkController } from './controllers/campaigns.controller';
import { DonationController } from './controllers/donations.controller';
import { BeneficiaryCampaignsController } from './controllers/beneficiary-campaigns.controller';
import { BeneficiaryDistributionsController } from './controllers/beneficiary-distributions.controller';

import { Campaigns } from './entities/campaign.entity';
import { Donation } from './entities/donation.entity';
import { BeneficiaryCampaigns } from './entities/beneficiary-campaigns.entity';
import { BeneficiaryDistribution } from './entities/beneficiary-distribution.entity';
import { CampaignImages } from './entities/campaign-images.entity';

import { LedgerModule } from '../double-entry-ledger/ledger.module';
import { UsersModule } from '../users/users.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaigns,
      Donation,
      BeneficiaryCampaigns,
      BeneficiaryDistribution,
      CampaignImages,
    ]),
    LedgerModule,
    UsersModule,
    BeneficiariesModule,
    NotificationsModule,
    StorageModule,
  ],
  controllers: [
    CampaignsController,
    CampaignsLinkController, // ⬅️ adds /campaign/link/:id
    DonationController,
    BeneficiaryCampaignsController,
    BeneficiaryDistributionsController,
  ],
  providers: [
    CampaignsService,
    DonationService,
    BeneficiaryCampaignsService,
    BeneficiaryDistributionService,
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}
