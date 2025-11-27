// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthService } from './service/auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { FirebaseAdminService } from './service/firebase.service';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAdminService,

    // Make AuthGuard global so it runs for every route by default.
    // Use @Public() on controller methods you want to skip auth for.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  // No need to export the guard when it's global.
  exports: [AuthService],
})
export class AuthModule {}
