import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/modules/database/users/users.service';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  public async validate(payload: any) {
    const isActive = await this.usersService.isUserActive(payload.id);
    if (!isActive) {
      throw new UnauthorizedException();
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
