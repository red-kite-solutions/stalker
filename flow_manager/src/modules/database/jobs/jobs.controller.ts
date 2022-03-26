import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobsService } from './jobs.service';
import { Job } from './models/jobs.model';

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
    console.log(unidentifiedJob);
    // TODO: This should go through the message queue
    const job = await this.jobsService.create(unidentifiedJob);
    const isOk: boolean = await JobsQueueUtils.add(job);

    if (!isOk) {
      throw new HttpException('Error sending the job to the job queue.', 500);
    }

    return job;
  }
}
