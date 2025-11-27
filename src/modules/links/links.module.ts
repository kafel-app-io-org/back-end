// src/modules/links/links.module.ts
import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
// import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    // CampaignsModule, // if you decide to fetch real campaign data
  ],
  controllers: [LinksController],
})
export class LinksModule {}
