import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Page } from '../../types/page.type';
import { Role } from '../auth/constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Finding } from '../database/reporting/findings/finding.model';
import { FindingsService } from './findings.service';

@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get()
  async get(
    @Query('target') target: string,
    @Query('page ') page = 1,
    @Query('pageSize ') pageSize = 15,
  ): Promise<Page<Finding>> {
    if (target == null || target.trim() === '')
      throw new BadRequestException('Must provide a target.');

    return await this.findingsService.getAll(target, page, pageSize);
  }
}
