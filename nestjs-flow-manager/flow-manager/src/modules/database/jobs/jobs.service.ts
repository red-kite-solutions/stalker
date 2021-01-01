import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { ReturnModelType } from "@typegoose/typegoose";
import * as idGenerator from 'uuid';
import { Job } from './jobs.model'
import { BaseService } from "../../../services/base.service";
import { CreateJobDto } from "./jobs.dto";


@Injectable()
export class JobsService extends BaseService<Job, Job> {
    constructor(@InjectModel("job") private readonly jobModel: ReturnModelType<typeof Job>) {
        super(jobModel);
    }

    public async addJob(dto: CreateJobDto) {
        console.log("addJob service: ")
        console.log(dto);
        await this.create({
            task: dto.task,
            program: dto.program,
            priority: dto.priority,
            jobId: idGenerator.v4(),
            data: dto.data
        });
    }
}