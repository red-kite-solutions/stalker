import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Page } from '../../types/page.type';
import { Role } from '../auth/constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../auth/guards/cron-api-token.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { ApiKeyStrategy } from '../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
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
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Get()
  async get(@Query() dto: FindingsPagingDto): Promise<Page<CustomFinding>> {
    return await this.findingsService.getAll(dto.page, dto.pageSize, dto);
  }
}
