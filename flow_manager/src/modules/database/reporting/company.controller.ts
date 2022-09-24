import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  HttpBadRequestException,
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
  EditCompanyDto,
  SubmitDomainsDto,
  SubmitHostDto,
} from './company.dto';
import { Company } from './company.model';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  private isValidIpRange(ipRange: string) {
    if (!/^\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?\/\d\d?$/.test(ipRange))
      return false;

    const ipMask = ipRange.split('/');

    if (parseInt(ipMask[1]) > 32) return false;

    const ipParts = ipMask[0].split('.');

    for (const part of ipParts) {
      if (parseInt(part) > 255) return false;
    }

    return true;
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ReadOnly)
  @Get()
  async getCompanies() {
    return await this.companyService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async createCompany(@Body(new ValidationPipe()) dto: CreateCompanyDto) {
    if ((dto.imageType && !dto.logo) || (dto.logo && !dto.imageType))
      throw new HttpBadRequestException();

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

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.User)
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
  @Put(':id')
  async editCompany(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: EditCompanyDto,
  ) {
    const data: Partial<Company> = {};
    if ((dto.imageType && !dto.logo) || (dto.logo && !dto.imageType)) {
      throw new HttpBadRequestException();
    } else if (dto.imageType && dto.logo) {
      data['logo'] = this.companyService.generateFullImage(
        dto.logo,
        dto.imageType,
      );
    } else if (dto.logo === '') {
      data['logo'] = dto.logo;
    }

    if (dto.ipRanges) {
      data['ipRanges'] = [];
      for (const range of dto.ipRanges) {
        if (!this.isValidIpRange(range)) {
          throw new HttpBadRequestException();
        }
        data['ipRanges'].push(range);
      }
    } else if (!dto.ipRanges?.length) {
      data['ipRanges'] = [];
    }

    if (dto.name === '') {
      throw new HttpBadRequestException();
    } else if (dto.name) {
      data['name'] = dto.name;
    }

    if (dto.notes || dto.notes === '') {
      data['notes'] = dto.notes;
    }

    try {
      return await this.companyService.editCompany(id, data);
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
  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    return await this.companyService.delete(id);
  }
}
