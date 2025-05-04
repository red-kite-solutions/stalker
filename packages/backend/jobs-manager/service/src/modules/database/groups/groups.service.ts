import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { ClientSession, FilterQuery, Model, Query, Types } from 'mongoose';
import { simplifyScopes } from '../../auth/utils/auth.utils';
import { GroupsFilterDto } from './groups.dto';
import { Group, GroupDocument } from './groups.model';
import { ADMIN_GROUP } from './groups.constants';

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

  public async getGroupMemberships(
    userId: string,
    session: ClientSession | undefined = undefined,
  ): Promise<GroupDocument[]> {
    return await this.groupModel.find(
      {
        members: { $eq: new Types.ObjectId(userId) },
      },
      undefined,
      { session },
    );
  }

  public async addToGroupFromName(groupName: string, userId: string) {
    return await this.addToGroup({ name: { $eq: groupName } }, userId);
  }

  public async addToGroupFromId(groupId: string, userId: string) {
    return await this.addToGroup({ _id: { $eq: groupId } }, userId);
  }

  private async addToGroup(filter: FilterQuery<Group>, userId: string) {
    return await this.groupModel.updateOne(filter, {
      $addToSet: { members: userId },
    });
  }

  public async getUserScopes(
    userId: string,
    session: ClientSession | undefined = undefined,
  ): Promise<string[]> {
    const groups = await this.getGroupMemberships(userId, session);
    const scopes = groups.flatMap((g) => g.scopes);
    return simplifyScopes(scopes);
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

  public async create(
    name: string,
    members: string[],
    scopes: string[],
  ): Promise<GroupDocument> {
    const simplifiedScopes = simplifyScopes(scopes);

    return await this.groupModel.create({
      name,
      members,
      scopes,
    });
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.groupModel
      .deleteOne({ _id: { $eq: id }, readonly: { $eq: false } })
      .select('domains');
  }

  public async removeGroupMemberships(userId: string) {
    return await this.groupModel.updateMany(
      {},
      {
        $pull: {
          members: { $eq: new Types.ObjectId(userId) },
        },
      },
    );
  }

  public async getAdminIds(): Promise<Types.ObjectId[]> {
    return (await this.groupModel.findOne({ name: { $eq: ADMIN_GROUP.name } }))
      .members;
  }

  public async isAdmin(userId: string, session: ClientSession) {
    const groups = await this.getGroupMemberships(userId, session);
    for (const group of groups) {
      if (group.name === ADMIN_GROUP.name) return true;
    }
    return false;
  }
}
