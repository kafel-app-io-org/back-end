import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// import { DepositService } from '../services/deposit.service';
import { UserIdentity } from '../../../common/decorator/user.decorator';
import { IUserIdentity } from '../../../common/interfaces/user-identity.interface';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../../common/enum/role.enum';
// import { CreateDepositDto } from '../dto/create-deposit.dto';
// import { Public } from '../../../common/decorator/public.decorator';
import { DepositCryptoService } from '../services/deposit-crypto.service';
import { VerifyPaymentDto } from '../dto/verify-payment.dto'; 

@ApiTags('Deposit')
@ApiBearerAuth()
@Controller('deposit')
export class DepositController {
  constructor(
    // private readonly depositService: DepositService,
    private readonly depositCryptoService: DepositCryptoService,
  ) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(
    @UserIdentity() user: IUserIdentity,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.depositCryptoService.create(user.id, verifyPaymentDto);
  }

  @Post('verify')
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    const result = await this.depositCryptoService.verifyErc20Transfer(
      verifyPaymentDto,
    );

    return result.success
      ? {
          status: 'success',
          message: `${verifyPaymentDto.token} payment of ${result.amount} verified`,
        }
      : {
          status: 'failure',
          message: 'Transaction does not match expected criteria',
        };
  }

  // @Post('webhook')
  // @Public()
  // webhookForStripe(@Req() req: RawBodyRequest<Request>) {
  //   const sig = req.headers['stripe-signature'];
  //   console.log('osssss', req.headers);
  //   console.log('osssss', req.rawBody);
  //   return this.depositService.handleWebhook(sig, req.rawBody, req.body);
  // }
}
