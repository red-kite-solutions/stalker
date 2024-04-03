import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { CustomJobTemplateSummary } from '../../../types/custom-job-template-summary.type';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { CustomJobTemplateDocument } from './custom-job-templates.model';
import { CustomJobTemplateService } from './custom-job-templates.service';

@Controller('custom-job-templates')
export class CustomJobTemplatesController {
  private logger = new Logger(CustomJobTemplatesController.name);
  constructor(private templatesService: CustomJobTemplateService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAll(): Promise<CustomJobTemplateDocument[]> {
    return await this.templatesService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summary')
  async getAllSummaries(): Promise<CustomJobTemplateSummary[]> {
    return await this.templatesService.getAllSummaries();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getTemplate(
    @Param() IdDto: MongoIdDto,
  ): Promise<CustomJobTemplateDocument> {
    return await this.templatesService.get(IdDto.id);
  }
}
