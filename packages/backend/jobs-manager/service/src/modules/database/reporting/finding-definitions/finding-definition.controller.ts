import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Page } from '../../../../types/page.type';
import { ApiDefaultResponsePage } from '../../../../utils/swagger.utils';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { CronApiTokenGuard } from '../../../auth/guards/cron-api-token.guard';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { FindingDefinitionPagingDto } from './finding-definition.dto';
import {
  FindingDefinition,
  FindingDefinitionDocument,
} from './finding-definition.model';
import { FindingDefinitionService } from './finding-definition.service';

@Controller('finding-definitions')
export class FindingDefinitionController {
  constructor(
    private readonly findingDefinitionService: FindingDefinitionService,
  ) {}

  @ApiExcludeEndpoint()
  @UseGuards(CronApiTokenGuard)
  @Post('cleanup')
  async cleanup() {
    await this.findingDefinitionService.cleanup();
  }

  /**
   * Read finding definitions.
   *
   * @remarks
   * Read finding definitions.
   *
   * Finding definitions are used by the front-end for custom tables and search query autocompletion.
   */
  @ApiDefaultResponsePage(FindingDefinition)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('data:finding-definitions:read')
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
