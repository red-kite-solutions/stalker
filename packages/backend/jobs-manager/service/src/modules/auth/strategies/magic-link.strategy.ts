import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UniqueTokenStrategy } from 'passport-unique-token';
import { UsersService } from '../../database/users/users.service';

@Injectable()
export class MagicLinkStrategy extends PassportStrategy(
  UniqueTokenStrategy,
  'magic-link',
) {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  public async validate(token: string) {
    const user = await this.usersService.validateIdentityUsingUniqueToken(
      token,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
