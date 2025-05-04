import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomJobTemplateSummary } from '../../../types/custom-job-template-summary.type';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { CustomJobTemplateDocument } from './custom-job-templates.model';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Controller('custom-job-templates')
export class CustomJobTemplatesController {
  private logger = new Logger(CustomJobTemplatesController.name);
  constructor(private templatesService: CustomJobTemplateService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get()
  async getAll(): Promise<CustomJobTemplateDocument[]> {
    return await this.templatesService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get('summary')
  async getAllSummaries(): Promise<CustomJobTemplateSummary[]> {
    return await this.templatesService.getAllSummaries();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get(':id')
  async getTemplate(
    @Param() IdDto: MongoIdDto,
  ): Promise<CustomJobTemplateDocument> {
    return await this.templatesService.get(IdDto.id);
  }
}
