import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomJobTemplateSummary } from '../../../types/custom-job-template-summary.type';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { CustomJobTemplateDocument } from './custom-job-templates.model';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Controller('custom-job-templates')
export class CustomJobTemplatesController {
  private logger = new Logger(CustomJobTemplatesController.name);
  constructor(private templatesService: CustomJobTemplateService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAll(): Promise<CustomJobTemplateDocument[]> {
    return await this.templatesService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summary')
  async getAllSummaries(): Promise<CustomJobTemplateSummary[]> {
    const foo = await this.templatesService.getAllSummaries();
    console.log(foo);
    return foo;
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getTemplate(
    @Param() IdDto: MongoIdDto,
  ): Promise<CustomJobTemplateDocument> {
    return await this.templatesService.get(IdDto.id);
  }
}
