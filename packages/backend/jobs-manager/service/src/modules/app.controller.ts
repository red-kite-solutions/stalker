import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { Role } from './auth/constants';
import { Scopes } from './auth/decorators/scopes.decorator';
import { ScopesGuard } from './auth/guards/scope.guard';
import { ApiKeyStrategy } from './auth/strategies/api-key.strategy';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Scopes('manage:health:version')
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Get()
  getVersion(): string {
    return this.appService.getVersion();
  }

  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
