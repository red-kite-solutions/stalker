import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { Domain } from '../reporting/domain/domain.model';
import { Host } from '../reporting/host/host.model';
import { Port } from '../reporting/port/port.model';
import { Website } from '../reporting/websites/website.model';
import { Tag, TagsDocument } from './tag.model';

@Injectable()
export class TagsService {
  private logger = new Logger(TagsService.name);

  constructor(
    @InjectModel('tags') private readonly tagsModel: Model<Tag>,
    @InjectModel('domain') private readonly domainsModel: Model<Domain>,
    @InjectModel('host') private readonly hostsModel: Model<Host>,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    @InjectModel('websites') private readonly websiteModel: Model<Website>,
  ) {}

  public async create(text: string, color: string) {
    return await this.tagsModel.create({ text: text, color: color });
  }

  public async getAll(): Promise<TagsDocument[]> {
    return await this.tagsModel.find();
  }

  public async getById(id: string) {
    return await this.tagsModel.findById(id);
  }

  public async getByText(text: string) {
    return await this.tagsModel.findOne({ text: { $eq: text } });
  }

  public async delete(id: string): Promise<DeleteResult> {
    const tagId = new Types.ObjectId(id);
    const delResult = await this.tagsModel.deleteOne({
      _id: { $eq: tagId },
    });
    if (delResult.deletedCount <= 0) return delResult;

    // Not awaited to finish quickly and untag in the background
    this.domainsModel
      .updateMany({ tags: tagId }, { $pull: { tags: tagId } })
      .exec();
    this.hostsModel
      .updateMany({ tags: tagId }, { $pull: { tags: tagId } })
      .exec();
    this.portsModel
      .updateMany({ tags: tagId }, { $pull: { tags: tagId } })
      .exec();

    this.websiteModel
      .updateMany({ tags: tagId }, { $pull: { tags: tagId } })
      .exec();

    return delResult;
  }

  public async tagExists(id: string): Promise<boolean> {
    return !!(await this.tagsModel.countDocuments(
      { _id: { $eq: new Types.ObjectId(id) } },
      { limit: 1 },
    ));
  }
}
