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
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/MongoIdDto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Job } from '../jobs/models/jobs.model';

import {
  CreateCompanyDto,
  CreateJobDto,
  EditCompanyDto,
  SubmitDomainsDto,
  SubmitHostsDto,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getCompanies() {
    return await this.companyService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summary')
  async getCompanySummaries() {
    return await this.companyService.getAllSummaries();
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
  async submitHosts(
    @Body(new ValidationPipe()) dto: SubmitHostsDto,
    @Param() idDto: MongoIdDto,
  ) {
    return await this.companyService.addHosts(dto.ips, idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id/job')
  async createJob(
    @Param() idDto: MongoIdDto,
    @Body(new ValidationPipe()) dto: CreateJobDto,
  ): Promise<Job> {
    return await this.companyService.publishJob({
      ...dto,
      companyId: idDto.id,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id/domain')
  async submitDomains(
    @Body(new ValidationPipe()) dto: SubmitDomainsDto,
    @Param() idDto: MongoIdDto,
  ) {
    return await this.companyService.addDomains(dto.domains, idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getCompany(@Param() id: MongoIdDto) {
    return await this.companyService.get(id.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editCompany(
    @Param() id: MongoIdDto,
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
        // TODO: Validate the ip ranges through a decorator
        if (!this.isValidIpRange(range)) {
          throw new HttpBadRequestException();
        }
        data['ipRanges'].push(range);
      }
    } else if (Array.isArray(dto.ipRanges)) {
      // ^ This previous line checks for an empty array. The check is needed because the value
      // may also be, at this point, null or undefined
      // If an empty array is explicitly provided, it is because the user wants to
      // empty the company's ipRanges array. Therefore, we assign an empty array to overwrite the
      // existing one in the database.
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
      return await this.companyService.editCompany(id.id, data);
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
  async deleteCompany(@Param() id: MongoIdDto) {
    return await this.companyService.delete(id.id);
  }
}
