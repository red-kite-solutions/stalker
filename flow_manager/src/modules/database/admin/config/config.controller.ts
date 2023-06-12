import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { SubmitConfigDto } from './config.dto';
import { Config } from './config.model';
import { ConfigService } from './config.service';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/config')
export class ConfigController {
  private logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  @Roles(Role.Admin)
  @Put()
  async submitConfig(
    @Body(new ValidationPipe()) dto: SubmitConfigDto,
  ): Promise<void> {
    try {
      await this.configService.submitConfig(dto);
    } catch (err) {
      const msg = 'Error changing config';
      this.logger.error(msg);
      this.logger.error(err);
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles(Role.Admin)
  @Get()
  async getConfig(): Promise<Config> {
    try {
      return await this.configService.getConfig();
    } catch (err) {
      const msg = 'Error getting config';
      this.logger.error(msg);
      this.logger.error(err);
      throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles(Role.ReadOnly)
  @Get('job-pods')
  async getJobPodConfigs(): Promise<JobPodConfiguration[]> {
    return await this.configService.getAllJobPodConfigs();
  }
}
