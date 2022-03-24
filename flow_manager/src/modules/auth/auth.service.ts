import { Injectable } from '@nestjs/common';
import { UsersService } from '../database/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { rtConstants, jwtConstants } from './constants';
import { UserDocument } from '../database/users/users.model';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  public async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmailIncludeHash(email);
    if (user && user.active) {
      if (await this.usersService.passwordEquals(user.password, pass)) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  public createRefreshToken(userId: string) {
    const payload = { id: userId };

    const token = this.jwtService.sign(payload, {
      secret: rtConstants.secret,
      expiresIn: rtConstants.expirationTime,
    });

    this.usersService.setRefreshToken(token, userId);
    return token;
  }

  public createAccessToken(user: Partial<UserDocument>): string {
    return this.jwtService.sign(user, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expirationTime,
    });
  }

  public async removeRefreshToken(userId: string) {
    this.usersService.removeRefreshToken(userId);
  }
}
