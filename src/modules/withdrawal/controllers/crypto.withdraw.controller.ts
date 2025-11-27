import { Body, Controller, Post } from '@nestjs/common';
import { CryptoWithdrawService } from '../services/crypto.withdraw.service';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { CryptoDto } from '../dto/crypto.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('withdraw/accounts/crypto')
@ApiTags('withdraw')
export class CryptoWithdrawController {
  constructor(private readonly cryptoWithdrawService: CryptoWithdrawService) {}

  @Post()
  createOrUpdate(@UserIdentity() user: IUserIdentity, @Body() dto: CryptoDto) {
    return this.cryptoWithdrawService.createOrUpdate(user.id, dto);
  }
}
