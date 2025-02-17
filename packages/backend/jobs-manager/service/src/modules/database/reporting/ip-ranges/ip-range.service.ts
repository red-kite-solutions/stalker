import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { FindingsQueue } from '../../../queues/finding-queue/findings-queue';
import { TagsService } from '../../tags/tag.service';
import { Host } from '../host/host.model';
import { Project } from '../project.model';
import { BatchEditIpRangesDto, IpRangesFilterDto } from './ip-range.dto';
import { HostDocument, IpRange } from './ip-range.model';

@Injectable()
export class IpRangeService {
  private logger = new Logger(IpRangeService.name);

  constructor(
    @InjectModel('iprange') private readonly ipRangeModel: Model<IpRange>,
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private tagsService: TagsService,
    private findingsQueue: FindingsQueue,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: IpRangesFilterDto = null,
  ): Promise<HostDocument[]> {
    let query;
    if (filter) {
      query = this.ipRangeModel.find(this.buildFilters(filter));
    } else {
      query = this.ipRangeModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async keyIsBlocked(correlationKey: string): Promise<boolean> {
    const h = await this.ipRangeModel.findOne(
      { correlationKey: { $eq: correlationKey } },
      'blocked',
    );

    return h && h.blocked;
  }

  public async count(filter: IpRangesFilterDto = null) {
    if (!filter) {
      return await this.ipRangeModel.estimatedDocumentCount();
    } else {
      return await this.ipRangeModel.countDocuments(this.buildFilters(filter));
    }
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.ipRangeModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  public async get(id: string) {
    return this.ipRangeModel.findById(id);
  }

  public async unlinkHost(
    ipRangeId: string,
    hostId: string,
  ): Promise<UpdateResult> {
    return await this.ipRangeModel.updateOne(
      { _id: { $eq: new Types.ObjectId(ipRangeId) } },
      { $pull: { hosts: { id: new Types.ObjectId(hostId) } } },
    );
  }

  private buildFilters(dto: IpRangesFilterDto) {
    const finalFilter = {};

    // Filter by ip
    if (dto.hosts) {
      const hosts = dto.hosts
        .filter((x) => x)
        .map((x) => x.toLowerCase().trim())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(`.*${x}.*`));

      if (hosts.length > 0) {
        finalFilter['ip'] = { $in: hosts };
      }
    }

    // Filter by host?
    // TODO: convert IP to integer
    // Search if it is contained between min and max

    // Filter by project
    if (dto.projects) {
      const projectIds = dto.projects
        .filter((x) => x)
        .map((x) => new Types.ObjectId(x));

      if (projectIds.length > 0) {
        finalFilter['projectId'] = { $in: projectIds };
      }
    }

    // Filter by tag
    if (dto.tags) {
      const preppedTagsArray = dto.tags.map((x) => new Types.ObjectId(x));
      finalFilter['tags'] = { $all: preppedTagsArray };
    }

    // Filter by createdAt
    if (dto.firstSeenStartDate || dto.firstSeenEndDate) {
      let createdAtFilter = {};

      if (dto.firstSeenStartDate && dto.firstSeenEndDate) {
        createdAtFilter = [
          { createdAt: { $gte: dto.firstSeenStartDate } },
          { createdAt: { $lte: dto.firstSeenEndDate } },
        ];
        finalFilter['$and'] = createdAtFilter;
      } else {
        if (dto.firstSeenStartDate)
          createdAtFilter = { $gte: dto.firstSeenStartDate };
        else if (dto.firstSeenEndDate)
          createdAtFilter = { $lte: dto.firstSeenEndDate };
        finalFilter['createdAt'] = createdAtFilter;
      }
    }

    // Filter by blocked
    if (dto.blocked === false) {
      finalFilter['$or'] = [
        { blocked: { $exists: false } },
        { blocked: { $eq: false } },
      ];
    } else if (dto.blocked === true) {
      finalFilter['blocked'] = { $eq: true };
    }

    return finalFilter;
  }

  public async tagIpRange(
    ipRangeId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const host = await this.ipRangeModel.findById(ipRangeId);
    if (!host) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.ipRangeModel.updateOne(
        { _id: { $eq: new Types.ObjectId(ipRangeId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.ipRangeModel.updateOne(
        { _id: { $eq: new Types.ObjectId(ipRangeId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  /**
   * Tag a host according to its IP and projectId
   * @param ip
   * @param projectId
   * @param tagId Expects a valid tagId
   * @param isTagged True to tag, False to untag
   * @returns
   */
  public async tagHostByIp(
    ip: string,
    projectId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    if (!isTagged) {
      return await this.ipRangeModel.updateOne(
        { ip: { $eq: ip }, projectId: { $eq: new Types.ObjectId(projectId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      return await this.ipRangeModel.updateOne(
        { ip: { $eq: ip }, projectId: { $eq: new Types.ObjectId(projectId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  public async batchEdit(dto: BatchEditIpRangesDto) {
    const update: Partial<IpRange> = {};
    if (dto.block || dto.block === false) update.blocked = dto.block;
    if (dto.block) update.blockedAt = Date.now();

    return await this.ipRangeModel.updateMany(
      { _id: { $in: dto.ipRangeIds.map((v) => new Types.ObjectId(v)) } },
      update,
    );
  }
}
