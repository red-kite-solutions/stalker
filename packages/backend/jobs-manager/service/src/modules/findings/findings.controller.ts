import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Page } from '../../types/page.type';
import { Role } from '../auth/constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { FindingsPagingDto } from './finding.dto';
import { FindingsService } from './findings.service';

@Roles(Role.ReadOnly)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get()
  async get(@Query() dto: FindingsPagingDto): Promise<Page<CustomFinding>> {
    return await this.findingsService.getAll(+dto.page, +dto.pageSize, dto);
  }
}
