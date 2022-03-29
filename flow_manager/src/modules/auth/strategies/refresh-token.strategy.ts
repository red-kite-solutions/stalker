import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserDocument } from 'src/modules/database/users/users.model';
import { UsersService } from 'src/modules/database/users/users.service';
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
    const user: UserDocument =
      await this.usersService.getUserIfRefreshTokenMatches(
        refreshToken,
        payload.id,
      );
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user._id, role: user.role, email: user.email };
  }
}
