import { Model } from 'mongoose'
import { BaseService } from "../../services/base.service";
import { Job } from "../jobs/jobs.model";
import { JobSchedule } from "./job_schedule.model";



export class JobScheduleService extends BaseService<JobSchedule, JobSchedule> {

    constructor(JobScheduleModel: Model<JobSchedule>) {
        super(JobScheduleModel);
    }

    public async addJob(job: Job) {
        
    }
}