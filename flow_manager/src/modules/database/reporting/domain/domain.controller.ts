import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { CompanyService } from '../company.service';
import { SubmitDomainDto, SubmitDomainManuallyDto } from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('report/domains')
export class DomainsController {
  constructor(
    private readonly domainsService: DomainsService,
    private readonly companyService: CompanyService,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Post('worker')
  async submitSubdomainsByWorker(
    @Body(new ValidationPipe()) dto: SubmitDomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomains(dto);
    return;
  }

  @UseGuards(ApiKeyGuard)
  @Post(':jobId')
  async submitSubdomainsFromJob(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) subdomains: SubmitDomainDto,
  ): Promise<void> {
    await this.domainsService.addDomainsFromJob(subdomains, jobId);
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async submitSubdomains(
    @Body(new ValidationPipe()) dto: SubmitDomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomains(dto);
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('index/:id')
  async getDomain(@Param('id') id: string): Promise<DomainDocument> {
    return await this.domainsService.getDomain(id);
  }
}
