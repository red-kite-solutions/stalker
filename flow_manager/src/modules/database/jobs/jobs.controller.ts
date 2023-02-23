import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HttpBadRequestException } from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/MongoIdDto';
import { JobSummary } from '../../../types/job-summary.type';
import { CompanyUnassigned } from '../../../validators/isCompanyId.validator';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { StartJobDto } from '../reporting/company.dto';
import { JobParameter } from '../subscriptions/subscriptions.model';
import { JobDefinitions } from './job-model.module';
import { JobFactory } from './jobs.factory';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly customJobsService: CustomJobsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllJobs(): Promise<any> {
    return await this.jobsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summaries')
  async getAllJobSummaries(): Promise<JobSummary[]> {
    const jd = JobDefinitions.map((jd): JobSummary => {
      return { name: jd.name, parameters: jd.params, source: 'Stalker' };
    });

    jd.splice(
      jd.findIndex((v) => v.name === 'CustomJob'),
      1,
    );

    const cjd = await this.customJobsService.getAllSummaries();
    return jd.concat(cjd);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async startJob(@Body() dto: StartJobDto) {
    const companyIdParameter = new JobParameter();
    companyIdParameter.name = 'companyId';
    companyIdParameter.value = CompanyUnassigned;
    dto.jobParameters.push(companyIdParameter);

    // parameters are validated thoroughly in job creation
    const job = JobFactory.createJob(dto.task, dto.jobParameters);

    if (!job) throw new HttpBadRequestException();
    job.priority = 1;

    return await this.jobsService.publish(job);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteAllJobs() {
    return await this.jobsService.deleteAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteJob(@Param() dto: MongoIdDto) {
    return await this.jobsService.delete(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getJob(@Param() dto: MongoIdDto): Promise<any> {
    return await this.jobsService.getById(dto.id);
  }
}
