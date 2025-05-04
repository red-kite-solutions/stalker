import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyService } from '../database/api-key/api-key.service';
import { GroupsService } from '../database/groups/groups.service';
import {
  ScopedUserDocument,
  UserDocument,
} from '../database/users/users.model';
import { UsersService } from '../database/users/users.service';
import { jwtConstants, rtConstants } from './constants';
import { passwordEquals } from './utils/auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService,
    public jwtService: JwtService,
    private apiKeyService: ApiKeyService,
  ) {}

  public async validateUser(
    email: string,
    pass: string,
  ): Promise<Partial<UserDocument>> {
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

  public async createAccessToken(
    user: Partial<ScopedUserDocument>,
  ): Promise<string> {
    const isActive = await this.usersService.isUserActive(user.id);
    if (!isActive) {
      throw new UnauthorizedException();
    }

    const scopes = await this.groupsService.getUserScopes(user.id);

    return this.jwtService.sign(
      { scopes, ...user },
      {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.expirationTime,
      },
    );
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
