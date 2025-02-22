import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import {
  ipv4RangeToMinMax,
  ipv4ToNumber,
} from '../../../../utils/ip-address.utils';
import { IpRangeFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../queues/finding-queue/findings-queue';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Project } from '../project.model';
import {
  BatchEditIpRangesDto,
  IpRangeDto,
  IpRangesFilterDto,
  SubmitIpRangesDto,
} from './ip-range.dto';
import { IpRange, IpRangeDocument } from './ip-range.model';

@Injectable()
export class IpRangeService {
  private logger = new Logger(IpRangeService.name);

  constructor(
    @InjectModel('ipranges') private readonly ipRangeModel: Model<IpRange>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private tagsService: TagsService,
    private findingsQueue: FindingsQueue,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: IpRangesFilterDto = null,
  ): Promise<IpRangeDocument[]> {
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

  private buildFilters(dto: IpRangesFilterDto) {
    const finalFilter = {};

    // Filter by ip
    if (dto.ips) {
      const ips = dto.ips
        .filter((x) => x)
        .map((x) => x.toLowerCase().trim())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(`.*${x}.*`));

      if (ips.length > 0) {
        finalFilter['ip'] = { $in: ips };
      }
    }

    // Filter by ip contained in range
    if (dto.contains) {
      const ipInt = ipv4ToNumber(dto.contains);
      finalFilter['ipMinInt'] = { $lte: ipInt };
      finalFilter['ipMaxInt'] = { $gte: ipInt };
    }

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
    const ipRange = await this.ipRangeModel.findById(ipRangeId);
    if (!ipRange) throw new HttpNotFoundException();

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
   * Tag an ip range according to its IP, mask and projectId
   * @param ip
   * @param mask
   * @param projectId
   * @param tagId Expects a valid tagId
   * @param isTagged True to tag, False to untag
   * @returns
   */
  public async tagIpRangeByIp(
    ip: string,
    mask: number,
    projectId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    if (!isTagged) {
      return await this.ipRangeModel.updateOne(
        {
          ip: { $eq: ip },
          mask: { $eq: mask },
          projectId: { $eq: new Types.ObjectId(projectId) },
        },
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

  public async delete(id: string) {
    return await this.ipRangeModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async deleteMany(ids: string[]) {
    return await this.ipRangeModel.deleteMany({
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    });
  }

  /**
   * Creates new Ip ranges in the database and publishes new
   * IpRangeFindings to the queue to seed the automation.
   * @param dto
   */
  public async submitIpRanges(dto: SubmitIpRangesDto) {
    const project = await this.projectModel.findById(dto.projectId);
    if (!project)
      throw new HttpNotFoundException(`Project ${dto.projectId} not found`);

    const ipRangeDocuments: IpRangeDocument[] = [];
    for (const range of dto.ranges) {
      const minMax = ipv4RangeToMinMax(range.ip, range.mask);
      const model = new this.ipRangeModel({
        _id: new Types.ObjectId(),
        ip: range.ip,
        mask: range.mask,
        projectId: new Types.ObjectId(dto.projectId),
        correlationKey: CorrelationKeyUtils.ipRangeCorrelationKey(
          dto.projectId,
          range.ip,
          range.mask,
        ),
        ipMinInt: minMax.min,
        ipMaxInt: minMax.max,
      });

      ipRangeDocuments.push(model);
    }

    let insertedRanges: IpRangeDocument[] = [];

    // insertmany with ordered false to continue on fail and use the exception
    try {
      insertedRanges = await this.ipRangeModel.insertMany(ipRangeDocuments, {
        ordered: false,
      });
    } catch (err) {
      if (!err.writeErrors) {
        throw err;
      }
      insertedRanges = err.insertedDocs;
    }

    await this.publishIpRangeFindings(insertedRanges, dto.projectId);

    return insertedRanges;
  }

  public async addIpRange(ip: string, mask: number, projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.debug(`Could not find the project (projectId=${projectId})`);
      throw new HttpNotFoundException(`projectId=${projectId}`);
    }

    const projectIdObject = new Types.ObjectId(projectId);
    const minMax = ipv4RangeToMinMax(ip, mask);

    return await this.ipRangeModel.findOneAndUpdate(
      {
        ip: { $eq: ip },
        mask: { $eq: mask },
        projectId: { $eq: projectIdObject },
      },
      {
        lastSeen: Date.now(),
        $setOnInsert: {
          _id: new Types.ObjectId(),
          ip: ip,
          mask: mask,
          projectId: projectIdObject,
          correlationKey: CorrelationKeyUtils.ipRangeCorrelationKey(
            projectId,
            ip,
            mask,
          ),
          ipMinInt: minMax.min,
          ipMaxInt: minMax.max,
        },
      },
      { upsert: true, new: true },
    );
  }

  /**
   * For each new ip range found, a finding is created
   * We submit them by batch to hopefully better support large loads
   * @param newIpRanges New domains for which to create IpRangeFindings
   * @param projectId The project associated with the ip range/findings
   */
  private async publishIpRangeFindings(
    newIpRanges: IpRangeDto[],
    projectId: string,
  ) {
    if (newIpRanges.length <= 0) return;

    const batchSize = 30;

    let findings: IpRangeFinding[] = [];
    for (let i = 0; i < newIpRanges.length; ++i) {
      findings.push({
        type: 'IpRangeFinding',
        key: 'IpRangeFinding',
        ip: newIpRanges[i].ip,
        mask: newIpRanges[i].mask,
        projectId: projectId,
      });
      if (i % batchSize === 0) {
        await this.findingsQueue.publish(...findings);
        findings = [];
      }
    }
    this.findingsQueue.publish(...findings);
  }
}
