import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
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
    return await this.jobsService.publish(unidentifiedJob);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    return await this.jobsService.delete(id);
  }
}
