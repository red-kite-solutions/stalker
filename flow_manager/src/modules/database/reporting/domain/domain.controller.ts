import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Program } from '../program.model';
import { SubmitSubdomainDto, SubmitSubdomainManuallyDto } from './domain.dto';
import { DomainsService } from './domain.service';

@Controller('report/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post(':jobId')
  async submitSubdomainsFromJob(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) subdomains: SubmitSubdomainDto,
  ): Promise<void> {
    await this.domainsService.addDomains(subdomains, jobId);
    return;
  }

  @Post()
  async submitSubdomains(
    @Body(new ValidationPipe()) dto: SubmitSubdomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomainsManually(dto);
    return;
  }

  @Get('index/:program/:i')
  async returnDomainAtIndex(
    @Param('program') program: string,
    @Param('i') index: number,
  ): Promise<Program> {
    return await this.domainsService.getProgramFilterDomainAtIndex(
      program,
      index,
    );
  }
}
