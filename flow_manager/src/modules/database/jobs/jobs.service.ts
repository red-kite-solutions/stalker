import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { Job } from './jobs.model'
import { BaseService } from "../../../services/base.service";
import { CreateJobDto } from "./jobs.dto";
import { Model } from "mongoose";


@Injectable()
export class JobsService extends BaseService<Job, Job> {
    constructor(@InjectModel("job") private readonly jobModel: Model<Job>) {
        super(jobModel);
    }

    public async addJob(dto: CreateJobDto, jobId: string): Promise<Job> {
        let job = new Job();
        job.jobId = jobId;
        job.priority = dto.priority;
        job.program = dto.program;
        job.task = dto.task;
        job.data = dto.data;
        await this.create(job);
        return job;
    }
}