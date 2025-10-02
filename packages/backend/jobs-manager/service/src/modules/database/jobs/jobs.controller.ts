import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isNotEmpty, isString } from 'class-validator';
import {
  HttpBadRequestException,
  HttpNotFoundException,
  HttpNotImplementedException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { JobLog } from '../../../types/job-log.model';
import { Page } from '../../../types/page.type';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { CronApiTokenGuard } from '../../auth/guards/cron-api-token.guard';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { ConfigService } from '../admin/config/config.service';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { SecretsService } from '../secrets/secrets.service';
import { JobParameter } from '../subscriptions/subscriptions.type';
import { JobExecutionsService } from './job-executions.service';
import { JobExecutionsDto, JobManagementDto, StartJobDto } from './jobs.dto';
import { JobFactory, JobFactoryUtils } from './jobs.factory';
import { JobDocument } from './models/jobs.model';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobExecutionsService,
    private readonly customJobsService: CustomJobsService,
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:read')
  @Get()
  async getAllJobs(
    @Query()
    dto: JobExecutionsDto,
  ): Promise<Page<JobDocument>> {
    return await this.jobsService.getAll(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:read')
  @Get(':id/logs')
  async getJobLogs(@Param() id: MongoIdDto): Promise<Page<JobLog>> {
    return await this.jobsService.getLogs(id.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:create')
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:update')
  @Patch(':id')
  async stopJob(@Param() id: MongoIdDto, @Body() dto: JobManagementDto) {
    switch (dto.task) {
      case 'TerminateJob':
        await this.jobsService.terminate(id.id);
        break;
      default:
        throw new HttpNotImplementedException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:delete')
  @Delete()
  async deleteAllJobs() {
    return await this.jobsService.deleteAll();
  }

  @UseGuards(CronApiTokenGuard)
  @Post('cleanup')
  async cleanup() {
    await this.jobsService.cleanup();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:delete')
  @Delete(':id')
  async deleteJob(@Param() dto: MongoIdDto) {
    return await this.jobsService.delete(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-executions:read')
  @Get(':id')
  async getJob(@Param() dto: MongoIdDto): Promise<any> {
    return await this.jobsService.getById(dto.id);
  }
}
