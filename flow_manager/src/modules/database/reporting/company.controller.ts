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
import { isNotEmpty, isString } from 'class-validator';
import { DeleteResult, UpdateResult } from 'mongodb';
import {
  HttpBadRequestException,
  HttpConflictException,
  HttpNotFoundException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/MongoIdDto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { CustomJobEntry } from '../custom-jobs/custom-jobs.model';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { JobSources } from '../jobs/job-model.module';
import { JobFactory } from '../jobs/jobs.factory';
import { CustomJob } from '../jobs/models/custom-job.model';
import { Job } from '../jobs/models/jobs.model';
import { JobParameter } from '../subscriptions/subscriptions.model';

import {
  CreateCompanyDto,
  EditCompanyDto,
  StartJobDto,
  SubmitDomainsDto,
  SubmitHostsDto,
} from './company.dto';
import { Company } from './company.model';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly customJobsService: CustomJobsService,
  ) {}

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
  async startJobForCompany(
    @Param() idDto: MongoIdDto,
    @Body(new ValidationPipe()) dto: StartJobDto,
  ): Promise<Job> {
    if (dto.source === JobSources.userCreated) {
      if (!isNotEmpty(dto.task) || !isString(dto.task))
        throw new HttpBadRequestException(
          'The task parameter is not a valid string',
        );

      const customJob: CustomJobEntry = await this.customJobsService.getByName(
        dto.task,
      );
      if (!customJob) throw new HttpNotFoundException();

      const customJobParams = JSON.parse(JSON.stringify(dto.jobParameters));
      const jobParameters = [];
      jobParameters.push({ name: 'name', value: customJob.name });
      jobParameters.push({ name: 'code', value: customJob.code });
      jobParameters.push({ name: 'type', value: customJob.type });
      jobParameters.push({
        name: 'language',
        value: customJob.language,
      });
      jobParameters.push({
        name: 'customJobParameters',
        value: customJobParams,
      });
      dto.jobParameters = jobParameters;
      dto.task = CustomJob.name;
    }

    const companyIdParameter = new JobParameter();
    companyIdParameter.name = 'companyId';
    companyIdParameter.value = idDto.id;
    dto.jobParameters.push(companyIdParameter);

    // parameters are validated thoroughly in job creation
    const job = JobFactory.createJob(dto.task, dto.jobParameters);

    if (!job) throw new HttpBadRequestException();
    job.priority = 1;

    return await this.companyService.publishJob(job);
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
  ): Promise<UpdateResult> {
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
  async deleteCompany(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.companyService.delete(id.id);
  }
}
