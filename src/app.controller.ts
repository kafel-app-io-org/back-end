import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorator/public.decorator';
import { Role } from './common/enum/role.enum';
import { Roles } from './common/decorator/roles.decorator';
import { UserIdentity } from './common/decorator/user.decorator';
import { IUserIdentity } from './common/interfaces/user-identity.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth()
  @Get('landing-page')
  @Roles(Role.USER)
  getLandingPage(@UserIdentity() user: IUserIdentity) {
    return this.appService.getLandingPage(user);
  }
}
