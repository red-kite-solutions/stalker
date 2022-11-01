import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../database/users/users.service';
import { rtConstants } from '../constants';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request.body?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: rtConstants.secret,
      passReqToCallback: true,
    });
  }

  public async validate(req: Request, payload: any) {
    const refreshToken = req.body?.refresh_token;
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.id,
    );
    if (!user || !user.active) {
      throw new UnauthorizedException();
    }

    return { id: payload.id, role: user.role, email: user.email };
  }
}
