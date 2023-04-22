import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { isNotEmpty, isString } from 'class-validator';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/MongoIdDto';
import { JobSummary } from '../../../types/job-summary.type';
import { CompanyUnassigned } from '../../../validators/is-company-id.validator';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { CustomJobEntry } from '../custom-jobs/custom-jobs.model';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { StartJobDto } from '../reporting/company.dto';
import { JobParameter } from '../subscriptions/subscriptions.model';
import { JobDefinitions, JobSources } from './job-model.module';
import { JobFactory } from './jobs.factory';
import { JobsService } from './jobs.service';
import { CustomJob } from './models/custom-job.model';

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
      return {
        name: jd.name,
        parameters: jd.params,
        source: JobSources.builtIn,
      };
    });

    jd.splice(
      jd.findIndex((v) => v.name === CustomJob.name),
      1,
    );

    const cjd = await this.customJobsService.getAllSummaries();
    return jd.concat(cjd);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async startJob(@Body() dto: StartJobDto) {
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
