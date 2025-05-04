import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../../auth/constants';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { ConfigService } from './config.service';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('admin/config')
export class ConfigController {
  private logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  @Scopes(Role.ReadOnly)
  @Get('job-pods')
  async getJobPodConfigs(): Promise<JobPodConfiguration[]> {
    return await this.configService.getAllJobPodConfigs();
  }
}
