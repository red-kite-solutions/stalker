import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { CreateJobDto } from './jobs.dto';
import { Job } from './jobs.model';
import { JobsService } from './jobs.service';


@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Get()
    async getAllJobs(): Promise<any> {
        return await this.jobsService.findAllJobs();
    }

    @Post('create')
    async createJob(@Body(new ValidationPipe()) unidentifiedJob: CreateJobDto): Promise<void> {
        return await this.jobsService.addJob(unidentifiedJob);
    }
}
