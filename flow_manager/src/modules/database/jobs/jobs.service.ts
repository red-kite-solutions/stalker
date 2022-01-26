import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { Job } from './jobs.model'
import { BaseService } from "../../../services/base.service";
import { CreateJobDto } from "./jobs.dto";
import { Model } from "mongoose";
import { DomainNameResolvingJob } from "./jobs_factory/domain_name_resolving.job"
import { Type } from "class-transformer";
import { ManufacturedJob } from "./jobs_factory/manufactured_job";
import { SubdomainBruteforceJob } from "./jobs_factory/subdomain_bruteforce.job";


export enum JobTypes {
    DOMAIN_NAME_RESOLVING = "DOMAIN_NAME_RESOLVING",
    SUBDOMAIN_BRUTEFORCE = "SUBDOMAIN_BRUTEFORCE"
}

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

    public manufactureJob(jobType: string, program: string): ManufacturedJob {
        switch (jobType) {
            case JobTypes.DOMAIN_NAME_RESOLVING:
                return new DomainNameResolvingJob(this, program);

            case JobTypes.SUBDOMAIN_BRUTEFORCE:
                return new SubdomainBruteforceJob(this, program);
        }
        return null;
    }
}