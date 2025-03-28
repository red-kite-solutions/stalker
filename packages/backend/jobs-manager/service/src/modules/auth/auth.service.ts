import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyService } from '../database/api-key/api-key.service';
import { UserDocument } from '../database/users/users.model';
import { UsersService } from '../database/users/users.service';
import { jwtConstants, rtConstants } from './constants';
import { passwordEquals } from './utils/auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    public jwtService: JwtService,
    private apiKeyService: ApiKeyService,
  ) {}

  public async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmailIncludeHash(email);
    if (!user?.active) return null;

    const isPasswordValid = await passwordEquals(user.password, pass);

    if (!isPasswordValid) return null;

    const { password, ...result } = user;
    return result;
  }

  public async createRefreshToken(userId: string) {
    const payload = { id: userId };

    const token = this.jwtService.sign(payload, {
      secret: rtConstants.secret,
      expiresIn: rtConstants.expirationTime,
    });

    await this.usersService.setRefreshToken(token, userId);
    return token;
  }

  public async createAccessToken(user: Partial<UserDocument>): Promise<string> {
    const isActive = await this.usersService.isUserActive(user.id);
    if (!isActive) {
      throw new UnauthorizedException();
    }

    return this.jwtService.sign(user, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.expirationTime,
    });
  }

  public async removeRefreshToken(userId: string, refreshToken: string = null) {
    await this.usersService.removeRefreshToken(userId, refreshToken);
  }

  public async isAuthenticationSetup() {
    return await this.usersService.isFirstUserCreated();
  }

  public async findValidApiKey(key: string) {
    return await this.apiKeyService.findValidApiKey(key);
  }
}
