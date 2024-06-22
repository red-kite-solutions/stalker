import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { IpFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../job-queue/findings-queue';
import { ConfigService } from '../../admin/config/config.service';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { PortService } from '../port/port.service';
import { Project } from '../project.model';
import { HostFilterModel } from './host-filter.model';
import { BatchEditHostsDto } from './host.dto';
import { Host, HostDocument } from './host.model';
import { HostSummary } from './host.summary';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private configService: ConfigService,
    private tagsService: TagsService,
    @Inject(forwardRef(() => DomainsService))
    private domainService: DomainsService,
    private portsService: PortService,
    private findingsQueue: FindingsQueue,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: HostFilterModel = null,
  ): Promise<HostDocument[]> {
    let query;
    if (filter) {
      query = this.hostModel.find(this.buildFilters(filter));
    } else {
      query = this.hostModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  /**
   *
   * @param page
   * @param pageSize
   * @param filter A mongodb filter
   * @returns
   */
  public async getIps(
    page: number = null,
    pageSize: number = null,
    filter: FilterQuery<Host> = null,
  ): Promise<HostDocument[]> {
    let query;
    const projection = '_id ip';
    if (filter) {
      query = this.hostModel.find(filter, projection);
    } else {
      query = this.hostModel.find({}, projection);
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async keyIsBlocked(correlationKey: string): Promise<boolean> {
    const h = await this.hostModel.findOne(
      { correlationKey: { $eq: correlationKey } },
      'blocked',
    );

    return h && h.blocked;
  }

  public async count(filter: HostFilterModel = null) {
    if (!filter) {
      return await this.hostModel.estimatedDocumentCount();
    } else {
      return await this.hostModel.countDocuments(this.buildFilters(filter));
    }
  }

  public async addHostsWithDomain(
    ips: string[],
    domainName: string,
    projectId: string,
    tagsIds: string[] = [],
  ) {
    const domain = await this.domainService.getDomainByName(
      domainName,
      projectId,
    );
    if (!domain) {
      this.logger.debug(`Could not find the domain (domainName=${domainName})`);
      throw new HttpNotFoundException(`domainName=${domainName})`);
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.debug(`Could not find the project (projectId=${projectId})`);
      throw new HttpNotFoundException(`projectId=${projectId}`);
    }

    const allTags = await this.tagsService.getAll();
    const allTagsIds = new Set(allTags.map((x) => x._id.toString()));
    const existingTags = tagsIds
      .filter((x) => allTagsIds.has(x.toString()))
      .map((x) => new Types.ObjectId(x));

    if (existingTags.length != tagsIds.length) {
      this.logger.debug(
        `Some tags do not exist (tagsIds=${tagsIds
          .filter((x) => !allTagsIds.has(x))
          .join(',')})`,
      );
    }

    let hostSummaries: HostSummary[] = [];
    let newIps: string[] = [];
    let newHosts: Partial<HostDocument>[] = [];

    for (let ip of ips) {
      const ds: DomainSummary = {
        name: domain.name,
        id: domain._id,
      };
      let mongoId = new Types.ObjectId();
      const hostResult = await this.hostModel
        .findOneAndUpdate(
          {
            ip: { $eq: ip },
            projectId: { $eq: new Types.ObjectId(projectId) },
          },
          {
            $setOnInsert: {
              _id: mongoId,
              projectId: new Types.ObjectId(projectId),
              projectName: project.name,
              correlationKey: CorrelationKeyUtils.hostCorrelationKey(
                projectId,
                ip,
              ),
            },
            $addToSet: { domains: ds, tags: { $each: existingTags } },
            lastSeen: Date.now(),
          },
          { upsert: true, useFindAndModify: false },
        )
        .exec();

      if (!hostResult) {
        // inserted
        newIps.push(ip);
        newHosts.push({
          ip: ip,
          _id: mongoId.toString(),
          domains: [ds],
          projectId: new Types.ObjectId(projectId),
          correlationKey: CorrelationKeyUtils.hostCorrelationKey(projectId, ip),
        });
        hostSummaries.push({ id: mongoId, ip: ip });
      } else if (
        !hostResult.domains ||
        !hostResult.domains.some((ds) => ds.name === domainName)
      ) {
        // updated, so sync with relevant domain document must be done
        hostSummaries.push({ id: hostResult._id, ip: ip });
      }
    }

    await this.domainService.addHostsToDomain(domain._id, hostSummaries);

    return newHosts;
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.hostModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  public async getHost(id: string) {
    return this.hostModel.findById(id);
  }

  public async addHosts(hosts: string[], projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project)
      throw new HttpNotFoundException(`Project ${projectId} not found`);

    const hostDocuments: HostDocument[] = [];
    for (let ip of hosts) {
      const model = new this.hostModel({
        _id: new Types.ObjectId(),
        ip: ip,
        projectId: new Types.ObjectId(projectId),
        correlationKey: CorrelationKeyUtils.hostCorrelationKey(projectId, ip),
        lastSeen: Date.now(),
      });

      hostDocuments.push(model);
    }

    let insertedHosts: HostDocument[] = [];

    // insertmany with ordered false to continue on fail and use the exception
    try {
      insertedHosts = await this.hostModel.insertMany(hostDocuments, {
        ordered: false,
      });
    } catch (err) {
      if (!err.writeErrors) {
        throw err;
      }
      insertedHosts = err.insertedDocs;
    }

    const newIps: string[] = [];
    insertedHosts.forEach((host: HostDocument) => {
      newIps.push(host.ip);
    });

    const findings: IpFinding[] = [];
    // For each new domain name found, a finding is created
    newIps.forEach((ip) => {
      findings.push({
        type: 'IpFinding',
        key: 'IpFinding',
        ip: ip,
        projectId: projectId,
      });
    });
    this.findingsQueue.publish(...findings);

    return insertedHosts;
  }

  /**
   * This function adds a host to the database if it did not exist. If it existed,
   * the lastSeen value is updated.
   * @param host The ip address to add
   * @param projectId The host's project
   */
  public async addHost(host: string, projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.debug(`Could not find the project (projectId=${projectId})`);
      throw new HttpNotFoundException(`projectId=${projectId}`);
    }

    const projectIdObject = new Types.ObjectId(projectId);

    return await this.hostModel.findOneAndUpdate(
      { ip: { $eq: host }, projectId: { $eq: projectIdObject } },
      {
        lastSeen: Date.now(),
        $setOnInsert: {
          ip: host,
          correlationKey: CorrelationKeyUtils.hostCorrelationKey(
            projectId,
            host,
          ),
          projectId: projectIdObject,
        },
      },
      { upsert: true, new: true },
    );
  }

  public async delete(hostId: string): Promise<DeleteResult> {
    const domains = (await this.hostModel.findById(hostId).select('domains'))
      ?.domains;
    if (domains) {
      for (const domain of domains) {
        await this.domainService.unlinkHost(domain.id.toString(), hostId);
      }
    }

    await this.portsService.deleteAllForHost(hostId);

    return await this.hostModel.deleteOne({ _id: { $eq: hostId } });
  }

  public async deleteMany(hostIds: string[]) {
    let deleteResults: DeleteResult;
    for (const host of hostIds) {
      const r = await this.delete(host);
      if (!deleteResults) deleteResults = r;
      else deleteResults.deletedCount += r.deletedCount;
    }
    return deleteResults;
  }

  public async unlinkDomain(
    hostId: string,
    domainId: string,
  ): Promise<UpdateResult> {
    return await this.hostModel.updateOne(
      { _id: { $eq: new Types.ObjectId(hostId) } },
      { $pull: { domains: { id: new Types.ObjectId(domainId) } } },
    );
  }

  private buildFilters(dto: HostFilterModel) {
    const finalFilter = {};

    // Filter by domain
    if (dto.domain) {
      const domainRegexes = dto.domain
        .filter((x) => x)
        .map((x) => x.toLowerCase())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(x, 'i'));

      if (domainRegexes.length > 0) {
        finalFilter['domains.name'] = { $all: domainRegexes };
      }
    }

    // Filter by host
    if (dto.host) {
      const hosts = dto.host
        .filter((x) => x)
        .map((x) => x.toLowerCase().trim())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(`.*${x}.*`));

      if (hosts.length > 0) {
        finalFilter['ip'] = { $in: hosts };
      }
    }

    // Filter by project
    if (dto.project) {
      const projectIds = dto.project
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

  public async tagHost(
    hostId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const host = await this.hostModel.findById(hostId);
    if (!host) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.hostModel.updateOne(
        { _id: { $eq: new Types.ObjectId(hostId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.hostModel.updateOne(
        { _id: { $eq: new Types.ObjectId(hostId) } },
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
      return await this.hostModel.updateOne(
        { ip: { $eq: ip }, projectId: { $eq: new Types.ObjectId(projectId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      return await this.hostModel.updateOne(
        { ip: { $eq: ip }, projectId: { $eq: new Types.ObjectId(projectId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  public async batchEdit(dto: BatchEditHostsDto) {
    const update: Partial<Host> = {};
    if (dto.block || dto.block === false) update.blocked = dto.block;
    if (dto.block) update.blockedAt = Date.now();

    return await this.hostModel.updateMany(
      { _id: { $in: dto.hostIds.map((v) => new Types.ObjectId(v)) } },
      update,
    );
  }
}
