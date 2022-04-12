import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Domain } from 'domain';
import { Company } from '../company.model';
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

  @Post(':jobId')
  async submitSubdomainsFromJob(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) subdomains: SubmitDomainDto,
  ): Promise<void> {
    await this.domainsService.addDomainsFromJob(subdomains, jobId);
    return;
  }

  @Post()
  async submitSubdomains(
    @Body(new ValidationPipe()) dto: SubmitDomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomains(dto);
    return;
  }

  @Get('index/:id')
  async getDomain(@Param('id') id: string): Promise<DomainDocument> {
    return await this.domainsService.getDomain(id);
  }
}
