import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { Scopes } from './auth/decorators/scopes.decorator';
import { ScopesGuard } from './auth/guards/scope.guard';
import { ApiKeyStrategy } from './auth/strategies/api-key.strategy';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Get the application's version
   *
   * @remarks
   * Get the application's version from the `RK_VERSION` environment variable.
   *
   * @scopes manage:health:version
   */
  @Scopes('manage:health:version')
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Get()
  getVersion(): string {
    return this.appService.getVersion();
  }

  /**
   * Application health check
   *
   * @remarks
   * Know if the application is running. This call is unauthenticated.
   *
   */
  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
