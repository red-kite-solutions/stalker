import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyModule } from '../database/api-key/api-key.module';
import { GroupsModule } from '../database/groups/groups.module';
import { UsersModule } from '../database/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { JwtSocketioStrategy } from './strategies/jwt-socketio.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MagicLinkStrategy } from './strategies/magic-link.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    UsersModule,
    GroupsModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expirationTime },
    }),
    ApiKeyModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    MagicLinkStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    JwtSocketioStrategy,
    ApiKeyStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
