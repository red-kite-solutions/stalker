import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobContainer } from './job-container.model';

@Injectable()
export class JobContainerService {
  private logger = new Logger(JobContainerService.name);

  constructor(
    @InjectModel('jobContainers')
    private readonly containerModel: Model<JobContainer>,
  ) {}

  public async getAll() {
    return await this.containerModel.find();
  }

  public async get(id: string) {
    return await this.containerModel.findById(id);
  }
}
