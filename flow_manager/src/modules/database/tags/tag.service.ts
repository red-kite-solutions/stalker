import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { Tag } from './tag.model';

@Injectable()
export class TagsService {
  private logger = new Logger(TagsService.name);

  constructor(@InjectModel('tags') private readonly tagsModel: Model<Tag>) {}

  public async create(text: string, color: string) {
    return await this.tagsModel.create({ text: text, color: color });
  }

  public async getAll() {
    return await this.tagsModel.find();
  }

  public async getById(id: string) {
    return await this.tagsModel.findById(id);
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.tagsModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }
}
