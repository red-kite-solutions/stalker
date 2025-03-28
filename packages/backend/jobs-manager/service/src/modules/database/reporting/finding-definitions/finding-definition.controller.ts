import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { Page } from '../../../../types/page.type';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../../../auth/guards/cron-api-token.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { FindingDefinitionPagingDto } from './finding-definition.dto';
import { FindingDefinitionDocument } from './finding-definition.model';
import { FindingDefinitionService } from './finding-definition.service';

@Controller('finding-definitions')
export class FindingDefinitionController {
  constructor(
    private readonly findingDefinitionService: FindingDefinitionService,
  ) {}

  @UseGuards(CronApiTokenGuard)
  @Post('cleanup')
  async cleanup() {
    await this.findingDefinitionService.cleanup();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDefinitions(
    @Query() dto: FindingDefinitionPagingDto,
  ): Promise<Page<FindingDefinitionDocument>> {
    const totalRecords = await this.findingDefinitionService.count(dto);
    const items = await this.findingDefinitionService.getAll(
      dto.page,
      dto.pageSize,
      dto,
    );

    return {
      items,
      totalRecords,
    };
  }
}
