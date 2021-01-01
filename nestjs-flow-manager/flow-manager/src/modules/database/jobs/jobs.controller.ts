import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { CreateJobDto } from './jobs.dto';
import { Job } from './jobs.model';
import { JobsService } from './jobs.service';


@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Get()
    getAllJobs(): Promise<any>{
        return this.jobsService.findAll();
    }

    @Post('create')
    async createJob(@Body(new ValidationPipe()) unidentifiedJob: CreateJobDto): Promise<void> {
        console.log("controller: ");
        console.log(unidentifiedJob);
        return await this.jobsService.addJob(unidentifiedJob);
    }
}
