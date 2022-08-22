import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  HttpConflictException,
  HttpServerErrorException,
} from 'src/exceptions/http.exceptions';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { Job } from '../jobs/models/jobs.model';
import {
  CreateCompanyDto,
  CreateJobDto,
  SubmitDomainsDto,
  SubmitHostDto,
} from './company.dto';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getCompanies() {
    return await this.companyService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async createCompany(@Body(new ValidationPipe()) dto: CreateCompanyDto) {
    try {
      return await this.companyService.addCompany(dto);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id/host')
  async submitHostsManually(
    @Body(new ValidationPipe()) dto: SubmitHostDto,
    @Param('id') id: string,
  ) {
    return await this.companyService.addHostsWithDomain(
      dto.ips,
      dto.domainName,
      id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id/job')
  async createJob(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: CreateJobDto,
  ): Promise<Job> {
    return await this.companyService.publishJob({ ...dto, companyId: id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id/domain')
  async submitDomainsManually(
    @Body(new ValidationPipe()) dto: SubmitDomainsDto,
    @Param('id') id: string,
  ) {
    return await this.companyService.addDomains(dto.domains, id);
  }

  @UseGuards(ApiKeyGuard)
  @Post(':id/host/:jobId')
  async submitHosts(
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) dto: SubmitHostDto,
  ) {
    return await this.companyService.addHostsWithDomainFromJob(
      dto.ips,
      dto.domainName,
      id,
      jobId,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Post(':id/domain/:jobId')
  async submitSubdomainsFromJob(
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) dto: SubmitDomainsDto,
  ): Promise<void> {
    await this.companyService.addDomainsFromJob(dto.domains, id, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getCompany(@Param('id') id: string) {
    return await this.companyService.get(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    return await this.companyService.delete(id);
  }
}
