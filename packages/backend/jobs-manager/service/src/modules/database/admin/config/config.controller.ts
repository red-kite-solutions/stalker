import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiDefaultResponseExtendModelId } from '../../../../utils/swagger.utils';
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

  /**
   * Read the job pod configurations.
   *
   * @remarks
   * Read the job pod configurations.
   *
   * These configurations dictate how many resources are available to a single job pod.
   */
  @ApiDefaultResponseExtendModelId([JobPodConfiguration])
  @Scopes('manage:config:read')
  @Get('job-pods')
  async getJobPodConfigs(): Promise<JobPodConfiguration[]> {
    return await this.configService.getAllJobPodConfigs();
  }
}
