import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { ConfigService } from './config.service';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
@Controller('admin/config')
export class ConfigController {
  private logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  @Roles(Role.ReadOnly)
  @Get('job-pods')
  async getJobPodConfigs(): Promise<JobPodConfiguration[]> {
    return await this.configService.getAllJobPodConfigs();
  }
}
