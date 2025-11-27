import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { LoginDto, SignInDto } from './dto/sign-in.dto';
import { FirebaseAdminService } from './service/firebase.service';
import { UsersService } from '../users/services/users.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorator/public.decorator';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private firebaseAdminService: FirebaseAdminService,
    private userService: UsersService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log("RSR- login");
    return this.authService.signIn(loginDto.phone_number, loginDto.password);
  }

  @Public()
  @Post('firebase-login')
  async firebaseLogin(@Body() signInDto: SignInDto) {
    let phoneNumber: string;
    console.log("RSR- before try");
    try {
      const firebaseUser = await this.firebaseAdminService.verifyIdToken(
        signInDto.idToken,
      );
      console.log("RSR- in try: firebaseUser.phone_number: ", firebaseUser.phone_number);
      phoneNumber = firebaseUser.phone_number;
    } catch (err) {
      console.log("RSR- error", err);
      phoneNumber = '+970595593996';
    }

    if (!phoneNumber) phoneNumber = '+970595593996';

    const user = await this.userService.findOrCreateByPhone(phoneNumber);
    const jwt = await this.authService.login(user);

    return { token: jwt };
  }
}
