import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, PipelineStage, Query, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import {
  ipv4RangeValuesToMinMax,
  ipv4ToNumber,
  numberToIpv4,
} from '../../../../utils/ip-address.utils';
import { IpRangeFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../queues/finding-queue/findings-queue';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Host } from '../host/host.model';
import { HostSummary } from '../host/host.summary';
import { Project } from '../project.model';
import {
  BatchEditIpRangesDto,
  IpRangeDto,
  IpRangesFilterDto,
  SubmitIpRangesDto,
} from './ip-range.dto';
import { ExtendedIpRange, IpRange, IpRangeDocument } from './ip-range.model';

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
    hostsLimit: number = 5,
  ): Promise<(IpRangeDocument | ExtendedIpRange)[]> {
    let query: Query<IpRangeDocument[], IpRangeDocument, any, IpRange> =
      undefined;
    if (filter) {
      query = this.ipRangeModel.find(this.buildFilters(filter));
    } else {
      query = this.ipRangeModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    let results = await query.lean().exec();

    if (filter && filter.detailsLevel === 'extended') {
      return await this.extendRangesWithHosts(results, hostsLimit);
    }

    return results;
  }

  private async extendRangesWithHosts(
    ipRanges: IpRangeDocument[],
    limit: number,
  ): Promise<ExtendedIpRange[]> {
    const facets: Record<string, PipelineStage.FacetPipelineStage[]> = {};

    if (!ipRanges.length) return [];

    for (const range of ipRanges) {
      facets[range.correlationKey.replaceAll('.', '-')] = [
        {
          $match: {
            projectId: { $eq: range.projectId },
            ipInt: { $gte: range.ipMinInt, $lte: range.ipMaxInt },
          },
        },
        {
          $project: {
            ip: 1,
            id: '$_id',
            _id: 0,
          },
        },
        {
          $limit: limit,
        },
      ];
    }

    if (!Object.keys(facets).length) return [];

    const results: Record<string, HostSummary[]>[] =
      await this.hostModel.aggregate([
        {
          $facet: facets,
        },
      ]);

    if (results.length === 0) return ipRanges;

    return ipRanges.map((range) => {
      return {
        ...range,
        hosts: results[0][range.correlationKey.replaceAll('.', '-')] ?? [],
      };
    });
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
    const finalFilter = { $and: [] };

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
      const or = [];
      for (const ip of dto.contains) {
        const ipInt = ipv4ToNumber(ip);
        const and = {
          $and: [{ ipMinInt: { $lte: ipInt } }, { ipMaxInt: { $gte: ipInt } }],
        };
        or.push(and);
      }
      finalFilter.$and.push({ $or: or });
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
        finalFilter.$and.push(createdAtFilter);
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

    if (finalFilter.$and.length === 0) delete finalFilter.$and;

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
    const targetIp = numberToIpv4(ipv4RangeValuesToMinMax(ip, mask).min);
    if (!isTagged) {
      return await this.ipRangeModel.updateOne(
        {
          ip: { $eq: targetIp },
          mask: { $eq: mask },
          projectId: { $eq: new Types.ObjectId(projectId) },
        },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      return await this.ipRangeModel.updateOne(
        {
          ip: { $eq: targetIp },
          projectId: { $eq: new Types.ObjectId(projectId) },
        },
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
      const minMax = ipv4RangeValuesToMinMax(range.ip, range.mask);
      const targetIp = numberToIpv4(minMax.min);
      const model = new this.ipRangeModel({
        _id: new Types.ObjectId(),
        ip: targetIp,
        mask: range.mask,
        projectId: new Types.ObjectId(dto.projectId),
        correlationKey: CorrelationKeyUtils.ipRangeCorrelationKey(
          dto.projectId,
          targetIp,
          range.mask,
        ),
        ipMinInt: minMax.min,
        ipMaxInt: minMax.max,
        lastSeen: Date.now(),
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
    const minMax = ipv4RangeValuesToMinMax(ip, mask);
    const targetIp = numberToIpv4(minMax.min);

    return await this.ipRangeModel.findOneAndUpdate(
      {
        ip: { $eq: targetIp },
        mask: { $eq: mask },
        projectId: { $eq: projectIdObject },
      },
      {
        lastSeen: Date.now(),
        $setOnInsert: {
          _id: new Types.ObjectId(),
          ip: targetIp,
          mask: mask,
          projectId: projectIdObject,
          correlationKey: CorrelationKeyUtils.ipRangeCorrelationKey(
            projectId,
            targetIp,
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
