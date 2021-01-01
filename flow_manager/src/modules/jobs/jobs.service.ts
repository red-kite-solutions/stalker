import { Model } from "mongoose";
import { BaseService } from "../../services/base.service";

import { Job } from './jobs.model'

export class JobsService extends BaseService<Job, Job> {
    constructor(jobModel: Model<Job>) {
        super(jobModel);
    }

    public async addJob(job: Job) {
        this.create(job);
    }
}