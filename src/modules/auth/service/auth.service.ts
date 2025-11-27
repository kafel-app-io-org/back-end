import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/modules/users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from 'src/common/utils/bcrypt';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    phone_number: string,
    pass: string,
  ): Promise<{ access_token: string; user }> {
    this.logger.debug({
      function: 'signIn',
      phone_number,
    });
    const user = await this.usersService.findOneBy({
      phone_number: phone_number,
    });
    if (!user || !(await comparePassword(pass, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    const payload = {
      id: user.id,
      username: user.phone_number,
      roles: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: user,
    };
  }

  async login(user): Promise<{ access_token: string; user }> {
    this.logger.debug({
      function: 'login',
      user,
    });
    const payload = {
      id: user.id,
      phone_number: user.phone_number,
      roles: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
