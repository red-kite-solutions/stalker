import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants, rtConstants } from '../constants';
import { Request } from 'express';
import { UsersService } from 'src/modules/database/users/users.service';
import { User, UserDocument } from 'src/modules/database/users/users.model';

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
    const user: UserDocument = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.id,
    );

    return { id: user._id, role: user.role, email: user.email };
  }
}
