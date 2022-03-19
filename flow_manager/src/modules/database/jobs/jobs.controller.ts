import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';
import { v4 } from 'uuid';
import { CreateJobDto } from './jobs.dto';
import { Job } from './jobs.model';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async getAllJobs(): Promise<any> {
    return await this.jobsService.getAll();
  }

  @Post('create')
  async createJob(
    @Body(new ValidationPipe()) unidentifiedJob: CreateJobDto,
  ): Promise<Job> {
    // TODO: This should go through the message queue
    const job = await this.jobsService.create(unidentifiedJob);
    const isOk: boolean = await JobsQueueUtils.add(
      job.jobId,
      unidentifiedJob.task,
      unidentifiedJob.priority,
      unidentifiedJob.data,
    );

    if (!isOk) {
      throw new HttpException('Error sending the job to the job queue.', 500);
    }

    return job;
  }
}
