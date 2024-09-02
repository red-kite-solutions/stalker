import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { Role } from './auth/constants';
import { Roles } from './auth/decorators/roles.decorator';
import { RolesGuard } from './auth/guards/role.guard';
import { ApiKeyStrategy } from './auth/strategies/api-key.strategy';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Roles(Role.ReadOnly)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Get()
  getVersion(): string {
    return this.appService.getVersion();
  }

  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
