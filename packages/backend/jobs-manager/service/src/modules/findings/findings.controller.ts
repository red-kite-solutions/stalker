import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Page } from '../../types/page.type';
import { Role } from '../auth/constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../auth/guards/cron-api-token.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { FindingsPagingDto } from './finding.dto';
import { FindingsService } from './findings.service';

@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @UseGuards(CronApiTokenGuard)
  @Post('cleanup')
  async cleanup() {
    await this.findingsService.cleanup();
  }

  @Roles(Role.ReadOnly)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async get(@Query() dto: FindingsPagingDto): Promise<Page<CustomFinding>> {
    if (dto.target == null || dto.target.trim() === '') {
      throw new BadRequestException('Must provide a target.');
    }

    return await this.findingsService.getAll(
      dto.target,
      +dto.page,
      +dto.pageSize,
    );
  }
}
