import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ConfigService } from './config.service';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

@UseGuards(JwtAuthGuard, RolesGuard)
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
