import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isNotEmpty, isString } from 'class-validator';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { JobLog } from '../../../types/job-log.model';
import { JobSummary } from '../../../types/job-summary.type';
import { Page } from '../../../types/page.type';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../../auth/guards/cron-api-token.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { ConfigService } from '../admin/config/config.service';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { SecretsService } from '../secrets/secrets.service';
import { JobParameter } from '../subscriptions/subscriptions.type';
import { JobExecutionsService } from './job-executions.service';
import { JobDefinitions } from './job-model.module';
import { JobExecutionsDto, StartJobDto } from './jobs.dto';
import { JobFactory, JobFactoryUtils } from './jobs.factory';
import { CustomJob } from './models/custom-job.model';
import { JobDocument } from './models/jobs.model';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobExecutionsService,
    private readonly customJobsService: CustomJobsService,
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllJobs(
    @Query()
    dto: JobExecutionsDto,
  ): Promise<Page<JobDocument>> {
    return await this.jobsService.getAll(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id/logs')
  async getJobLogs(@Param() id: MongoIdDto): Promise<Page<JobLog>> {
    return await this.jobsService.getLogs(id.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summaries')
  async getAllJobSummaries(): Promise<JobSummary[]> {
    const jd = JobDefinitions.map((jd): JobSummary => {
      return {
        name: jd.name,
        parameters: jd.params,
      };
    });

    jd.splice(
      jd.findIndex((v) => v.name === CustomJob.name),
      1,
    );

    const cjd = await this.customJobsService.getAllSummaries();
    return jd.concat(cjd);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post()
  async startJob(@Body() dto: StartJobDto) {
    let jpConfig: JobPodConfiguration = null;

    if (!isNotEmpty(dto.task) || !isString(dto.task))
      throw new HttpBadRequestException(
        'The task parameter is not a valid string',
      );

    const customJob = await this.customJobsService.getPickByName<
      '_id' | 'jobPodConfigId' | 'name'
    >(dto.task, ['_id', 'jobPodConfigId', 'name']);
    if (!customJob) throw new HttpNotFoundException();

    jpConfig = await JobFactoryUtils.getCustomJobPodConfig(
      customJob,
      this.configService,
    );

    dto.jobParameters = JobFactoryUtils.setupCustomJobParameters(
      customJob,
      dto.jobParameters,
    );

    const projectIdParameter = new JobParameter();
    projectIdParameter.name = 'projectId';
    projectIdParameter.value = dto.projectId
      ? dto.projectId
      : ProjectUnassigned;
    dto.jobParameters.push(projectIdParameter);

    // parameters are validated thoroughly in job creation
    const job = await JobFactory.createJob(
      dto.task,
      dto.jobParameters,
      this.secretsService,
      <string>projectIdParameter.value,
      jpConfig,
    );

    if (!job) throw new HttpBadRequestException();
    job.priority = 1;

    return await this.jobsService.publish(job);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteAllJobs() {
    return await this.jobsService.deleteAll();
  }

  @UseGuards(CronApiTokenGuard)
  @Post('cleanup')
  async cleanup() {
    await this.jobsService.cleanup();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteJob(@Param() dto: MongoIdDto) {
    return await this.jobsService.delete(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getJob(@Param() dto: MongoIdDto): Promise<any> {
    return await this.jobsService.getById(dto.id);
  }
}
