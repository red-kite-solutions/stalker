import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomJobTemplateSummary } from '../../../types/custom-job-template-summary.type';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import {
  CustomJobTemplate,
  CustomJobTemplateDocument,
} from './custom-job-templates.model';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Controller('custom-job-templates')
export class CustomJobTemplatesController {
  private logger = new Logger(CustomJobTemplatesController.name);
  constructor(private templatesService: CustomJobTemplateService) {}

  /**
   * Read the job templates.
   *
   * @remarks
   * Read the job templates. Job templates are useful to help a user write a new custom job.
   */
  @ApiDefaultResponseExtendModelId([CustomJobTemplate])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-templates:read')
  @Get()
  async getAll(): Promise<CustomJobTemplateDocument[]> {
    return await this.templatesService.getAll();
  }

  /**
   * Read the job templates summaries.
   *
   * @remarks
   * Read the job template summaries. Job templates summaries return most of the job template data,
   * without the code.
   */
  @ApiDefaultResponseExtendModelId([CustomJobTemplateSummary])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-templates:read')
  @Get('summary')
  async getAllSummaries(): Promise<CustomJobTemplateSummary[]> {
    return await this.templatesService.getAllSummaries();
  }

  /**
   * Read a job template by ID.
   *
   * @remarks
   * Read a job template by ID. Job templates are useful to help a user write a new custom job.
   */
  @ApiDefaultResponseExtendModelId(CustomJobTemplate)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-templates:read')
  @Get(':id')
  async getTemplate(
    @Param() IdDto: MongoIdDto,
  ): Promise<CustomJobTemplateDocument> {
    return await this.templatesService.get(IdDto.id);
  }
}
