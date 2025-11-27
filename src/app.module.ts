// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { CatchEverythingFilter } from './common/filters/all-exception.filter';
import { config } from './config/index';
import { LedgerModule } from './modules/double-entry-ledger/ledger.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConstantsModule } from './modules/constants/constants.module';
import { StorageModule } from './modules/storage/storage.module';
import { LinksModule } from './modules/links/links.module';
import { NfcModule } from './modules/nfc/nfc.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '100y' },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['x-lang'])],
    }),
    AuthModule,            // AuthGuard is made global inside AuthModule via APP_GUARD
    UsersModule,
    CampaignsModule,
    WithdrawalModule,
    BeneficiariesModule,
    LedgerModule,
    NotificationsModule,
    ConstantsModule,
    StorageModule,
    LinksModule,
    NfcModule, 
    StatsModule,  
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Keep only the global exception filter here
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
