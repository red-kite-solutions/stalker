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
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { SubmitConfigDto } from './config.dto';
import { Config } from './config.model';
import { ConfigService } from './config.service';

@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/config')
export class ConfigController {
  private logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

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
}
