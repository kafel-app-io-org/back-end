// src/modules/nfc/nfc.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NfcService } from './nfc.service';
import { NfcController } from './nfc.controller';
import { NfcDevice } from './entities/nfc-device.entity';
import { NfcOfflineToken } from './entities/nfc-offline-token.entity';

import { Users } from 'src/modules/users/entities/users.entity';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NfcDevice, NfcOfflineToken, Users]),
    // 👇 This gives NfcModule access to TransferService (and UsersService, etc.)
    UsersModule,
  ],
  controllers: [NfcController],
  providers: [NfcService],
  exports: [NfcService],
})
export class NfcModule {}
