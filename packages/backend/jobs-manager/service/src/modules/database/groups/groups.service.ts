import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { GroupsFilterDto } from './groups.dto';
import { Group, GroupDocument } from './groups.model';

@Injectable()
export class GroupsService {
  protected logger: Logger = new Logger(GroupsService.name);

  constructor(
    @InjectModel('groups') private readonly groupModel: Model<Group>,
  ) {}

  public async get(id: string) {
    return this.groupModel.findById(id);
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: GroupsFilterDto = null,
  ): Promise<GroupDocument[]> {
    let query: Query<GroupDocument[], GroupDocument, any, GroupDocument>;

    if (filter) {
      query = this.groupModel.find(await this.buildFilters(filter));
    } else {
      query = this.groupModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async count(filter: GroupsFilterDto = null) {
    if (!filter) {
      return await this.groupModel.estimatedDocumentCount();
    } else {
      return await this.groupModel.countDocuments(
        await this.buildFilters(filter),
      );
    }
  }

  private async buildFilters(dto: GroupsFilterDto) {
    return {};
  }
}
