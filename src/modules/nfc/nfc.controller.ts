import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { NfcService } from './nfc.service';
import { StartSessionDto } from './dto/start-session.dto';
import { PaymentRequestDto } from './dto/payment-request.dto';
import RolesGuard from '../../common/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorator/roles.decorator';
import { Role } from '../../common/enum/role.enum';

import { IUserIdentity } from '../../common/interfaces/user-identity.interface';
import { UserIdentity } from '../../common/decorator/user.decorator';


@ApiTags('NFC')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('nfc')
export class NfcController {
  constructor(private readonly nfc: NfcService) {}

  @Post('session/start')
  @Roles(Role.USER)
  async startSession(@UserIdentity() user: IUserIdentity, @Body() dto: StartSessionDto) {
    return this.nfc.startSessionAndMintTokens(user, dto);
  }

  @Post('payment')
  @Roles(Role.USER)
  async payment(@Body() dto: PaymentRequestDto) {
    return this.nfc.processPayment(dto);
  }
}
