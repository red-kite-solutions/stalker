import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

const socketioExtractor: JwtFromRequestFunction = (req: any) => {
  let token = null;
  if (req.auth?.token) token = req.auth.token;
  return token;
};

@Injectable()
export class JwtSocketioStrategy extends PassportStrategy(
  Strategy,
  'jwt-socketio',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([socketioExtractor]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  public validate(payload: any) {
    return { id: payload.id, email: payload.email, scopes: payload.scopes };
  }
}
