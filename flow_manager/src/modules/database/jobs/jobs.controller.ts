import { Body, Controller, Get, HttpException, Post, ValidationPipe } from '@nestjs/common';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';
import { CreateJobDto } from './jobs.dto';
import { Job } from './jobs.model';
import { JobsService } from './jobs.service';
import { v4 } from 'uuid';


@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) {}

    @Get()
    async getAllJobs(): Promise<any> {
        return await this.jobsService.findAll();
    }

    @Post('create')
    async createJob(@Body(new ValidationPipe()) unidentifiedJob: CreateJobDto): Promise<Job> {
        let id: string = v4();
        let isOk: boolean = await JobsQueueUtils.add(id, unidentifiedJob.task, unidentifiedJob.priority, unidentifiedJob.data);
        if(!isOk) {
            throw new HttpException("Error sending the job to the job queue.", 500);
        }
        return await this.jobsService.addJob(unidentifiedJob, id);        
    }
}
