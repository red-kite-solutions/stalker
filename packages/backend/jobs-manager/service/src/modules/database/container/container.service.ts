import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Container } from './container.model';

@Injectable()
export class ContainerService {
  private logger = new Logger(ContainerService.name);

  constructor(
    @InjectModel('containers')
    private readonly containerModel: Model<Container>,
  ) {}

  public async getByImage(image: string) {
    return await this.containerModel.find({ image: { $eq: image } });
  }

  public async getAll() {
    return await this.containerModel.find();
  }

  public async get(id: string) {
    return await this.containerModel.findById(id);
  }
}
