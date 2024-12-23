import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { WebsiteFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../job-queue/findings-queue';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Domain } from '../domain/domain.model';
import { DomainSummary } from '../domain/domain.summary';
import { Host } from '../host/host.model';
import { Port, PortDocument } from '../port/port.model';
import { WebsiteFilterModel } from './website-filter.model';
import { BatchEditWebsitesDto } from './website.dto';
import { Website, WebsiteDocument } from './website.model';

interface ExtendedWebsiteSearchQuery {
  projectIdObj: Types.ObjectId;
  existingDomainSummary: DomainSummary | undefined;
  existingPort: PortDocument;
  searchQuery: FilterQuery<Website>;
}

@Injectable()
export class WebsiteService {
  private logger = new Logger(WebsiteService.name);

  constructor(
    @InjectModel('websites') private readonly websiteModel: Model<Website>,
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('port') private readonly portModel: Model<Port>,
    private findingsQueue: FindingsQueue,
    private tagsService: TagsService,
  ) {}

  private async buildExtendedSearchQuery(
    projectId: string,
    ip: string,
    port: number,
    domain: string = undefined,
    path: string = '/',
  ): Promise<ExtendedWebsiteSearchQuery> {
    const projectIdObj = new Types.ObjectId(projectId);
    const existingPort = await this.portModel.findOne({
      'host.ip': { $eq: ip },
      port: { $eq: port },
      projectId: { $eq: projectIdObj },
      layer4Protocol: { $eq: 'tcp' },
    });

    if (!existingPort) {
      this.logger.error(
        `Failed to add a website because the port did not exist (project: ${projectId}, IP: ${ip}, port: ${port})`,
      );
      throw new HttpNotFoundException();
    }

    // Validate the domain
    let existingDomainSummary: DomainSummary = undefined;
    if (domain) {
      const existingDomain = await this.domainModel.findOne(
        {
          projectId: { $eq: projectIdObj },
          name: { $eq: domain },
        },
        '_id name',
      );

      if (existingDomain) {
        existingDomainSummary = {
          id: existingDomain._id,
          name: existingDomain.name,
        };
      } else {
        this.logger.error(
          `Domain not found while adding a website (project: ${projectId}, domain: ${domain})`,
        );
        throw new HttpNotFoundException();
      }
    } else {
      existingDomainSummary = undefined;
    }

    return {
      projectIdObj: projectIdObj,
      existingDomainSummary: existingDomainSummary,
      existingPort: existingPort,
      searchQuery: {
        'port.id': { $eq: existingPort._id },
        'domain.id': {
          $eq: existingDomainSummary ? existingDomainSummary.id : null,
        },
        path: { $eq: path },
      },
    };
  }

  public async addWebsite(
    projectId: string,
    ip: string,
    port: number,
    domain: string = undefined,
    path: string = '/',
    ssl: boolean = undefined,
  ) {
    // Search for a website with the proper port id, domain and path.
    // domain may or may not exist, it depends if it was found in the domains collection
    const extendedSearchQuery: ExtendedWebsiteSearchQuery =
      await this.buildExtendedSearchQuery(projectId, ip, port, domain, path);

    return await this.websiteModel.findOneAndUpdate(
      extendedSearchQuery.searchQuery,
      {
        $set: {
          lastSeen: Date.now(),
          ssl: ssl === false || ssl === true ? ssl : undefined,
        },
        $setOnInsert: {
          host: extendedSearchQuery.existingPort.host,
          domain: extendedSearchQuery.existingDomainSummary ?? null,
          port: {
            id: extendedSearchQuery.existingPort._id,
            port: extendedSearchQuery.existingPort.port,
          },
          path: path,
          sitemap: [],
          projectId: extendedSearchQuery.projectIdObj,
          correlationKey: CorrelationKeyUtils.websiteCorrelationKey(
            projectId,
            ip,
            port,
            extendedSearchQuery.existingDomainSummary
              ? extendedSearchQuery.existingDomainSummary.name
              : '',
            path,
          ),
        },
      },
      { upsert: true, new: true },
    );
  }

  public async addPathToWebsite(
    pathToAdd: string,
    projectId: string,
    ip: string,
    port: number,
    domain: string = undefined,
    path: string = '/',
  ) {
    const extendedSearchQuery = await this.buildExtendedSearchQuery(
      projectId,
      ip,
      port,
      domain,
      path,
    );

    return await this.websiteModel.findOneAndUpdate(
      extendedSearchQuery.searchQuery,
      { $addToSet: { sitemap: pathToAdd } },
      { new: true },
    );
  }

  /**
   * This method creates a WebsiteFinding for each domain linked to the host,
   * as well as one for the host's direct ip port access, without a domain.
   * @param jobId
   * @param projectId
   * @param ip
   * @param port
   * @param path
   * @returns
   */
  public async emitWebsiteFindingsForAllHostDomains(
    jobId: string,
    projectId: string,
    ip: string,
    port: number,
    path: string = '/',
    ssl: boolean = false,
  ) {
    const host = await this.hostModel.findOne({
      ip: { $eq: ip },
      projectId: { $eq: new Types.ObjectId(projectId) },
    });

    if (!host) {
      this.logger.error(
        `Failed to add the websites because the host did not exist (project: ${projectId}, IP: ${ip})`,
      );
      throw new HttpNotFoundException();
    }

    const websiteFindingBase: Omit<WebsiteFinding, 'domainName'> = {
      type: 'WebsiteFinding',
      key: 'WebsiteFinding',
      ip: ip,
      path: path,
      port: port,
      fields: [],
      protocol: 'tcp',
      ssl: ssl,
    };

    // We will create a website finding
    let findings: WebsiteFinding[] = [
      {
        domainName: '',
        ...websiteFindingBase,
      },
    ];

    for (const domainSummary of host.domains) {
      findings.push({
        domainName: domainSummary.name,
        ...websiteFindingBase,
      });

      if (findings.length >= 10) {
        await this.findingsQueue.publishForJob(jobId, ...findings);
        findings = [];
      }
    }

    this.findingsQueue.publishForJob(jobId, ...findings);
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.websiteModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  public async delete(websiteId: string): Promise<DeleteResult> {
    return await this.cleanup({
      _id: { $eq: new Types.ObjectId(websiteId) },
    });
  }

  public async deleteMany(websiteIds: string[]): Promise<DeleteResult> {
    return await this.cleanup({
      _id: { $in: websiteIds.map((wid) => new Types.ObjectId(wid)) },
    });
  }

  public async get(websiteId: string) {
    return await this.websiteModel.findById(websiteId);
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: WebsiteFilterModel = null,
  ): Promise<WebsiteDocument[]> {
    let query;
    if (filter) {
      query = this.websiteModel.find(await this.buildFilters(filter));
    } else {
      query = this.websiteModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async batchEdit(dto: BatchEditWebsitesDto) {
    const update: Partial<Host> = {};
    if (dto.block || dto.block === false) update.blocked = dto.block;
    if (dto.block) update.blockedAt = Date.now();

    return await this.websiteModel.updateMany(
      { _id: { $in: dto.websiteIds.map((v) => new Types.ObjectId(v)) } },
      update,
    );
  }

  public async getWebsites(
    page: number = null,
    pageSize: number = null,
    filter: FilterQuery<WebsiteDocument>,
  ): Promise<
    Pick<WebsiteDocument, '_id' | 'domain' | 'host' | 'port' | 'path' | 'ssl'>[]
  > {
    let query = this.websiteModel.find(filter, '_id domain host port path ssl');

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  private async buildFilters(filter: WebsiteFilterModel) {
    const finalFilter = {};

    // Filter by host ip
    if (filter.hosts) {
      const hostsRegex = filter.hosts
        .filter((x) => x)
        .map((x) => x.toLowerCase().trim())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(`.*${x}.*`));

      if (hostsRegex.length > 0) {
        const hosts = await this.hostModel.find(
          { ip: { $in: hostsRegex } },
          '_id',
        );
        if (hosts) finalFilter['host.id'] = { $in: hosts.map((h) => h._id) };
      }
    }

    // Filter by domain
    if (filter.domains) {
      const domainsRegex = filter.domains
        .filter((x) => x)
        .map((x) => x.toLowerCase().trim())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(`.*${x}.*`));

      if (domainsRegex.length > 0) {
        const domains = await this.domainModel.find(
          { name: { $in: domainsRegex } },
          '_id',
        );
        if (domains)
          finalFilter['domain.id'] = { $in: domains.map((d) => d._id) };
      }
    }

    // Filter by port
    if (filter.ports) {
      const ports = await this.portModel.find(
        { port: { $in: filter.ports } },
        '_id',
      );
      if (ports) finalFilter['port.id'] = { $in: ports.map((p) => p._id) };
    }

    // Filter by project
    if (filter.projects) {
      const projectIds = filter.projects
        .filter((x) => x)
        .map((x) => new Types.ObjectId(x));

      if (projectIds.length > 0) {
        finalFilter['projectId'] = { $in: projectIds };
      }
    }

    // Filter by tag
    if (filter.tags) {
      const preppedTagsArray = filter.tags
        .filter((x) => x)
        .map((x) => x.toLowerCase())
        .map((x) => new Types.ObjectId(x));

      if (preppedTagsArray.length > 0) {
        finalFilter['tags'] = {
          $all: preppedTagsArray.map((t) => new Types.ObjectId(t)),
        };
      }
    }

    // Filter by createdAt
    if (filter.firstSeenStartDate || filter.firstSeenEndDate) {
      let createdAtFilter = {};

      if (filter.firstSeenStartDate && filter.firstSeenEndDate) {
        createdAtFilter = [
          { createdAt: { $gte: filter.firstSeenStartDate } },
          { createdAt: { $lte: filter.firstSeenEndDate } },
        ];
        finalFilter['$and'] = createdAtFilter;
      } else {
        if (filter.firstSeenStartDate)
          createdAtFilter = { $gte: filter.firstSeenStartDate };
        else if (filter.firstSeenEndDate)
          createdAtFilter = { $lte: filter.firstSeenEndDate };
        finalFilter['createdAt'] = createdAtFilter;
      }
    }

    if (filter.mergedInId) {
      finalFilter['mergedInId'] = {
        $eq: new Types.ObjectId(filter.mergedInId),
      };
    }

    // Filter by blocked
    if (filter.blocked === false) {
      finalFilter['$or'] = [
        { blocked: { $exists: false } },
        { blocked: { $eq: false } },
      ];
    } else if (filter.blocked === true) {
      finalFilter['blocked'] = { $eq: true };
    }

    // Filter by merged
    if (filter.merged === false) {
      finalFilter['mergedInId'] = { $eq: null };
    } else if (filter.merged === true) {
      finalFilter['mergedInId'] = { $ne: null };
    }

    return finalFilter;
  }

  public async keyIsBlocked(correlationKey: string) {
    const website = await this.websiteModel.findOne(
      { correlationKey: { $eq: correlationKey } },
      'blocked mergedInId',
    );
    return website && (!!website.mergedInId || website.blocked);
  }

  public async count(filter: WebsiteFilterModel = null) {
    if (!filter) {
      return await this.websiteModel.estimatedDocumentCount();
    } else {
      return await this.websiteModel.countDocuments(
        await this.buildFilters(filter),
      );
    }
  }

  public async tagWebsite(
    websiteId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const website = await this.websiteModel.findById(websiteId);
    if (!website) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.websiteModel.updateOne(
        { _id: { $eq: new Types.ObjectId(websiteId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.websiteModel.updateOne(
        { _id: { $eq: new Types.ObjectId(websiteId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  public async tagWebsiteByCorrelationKey(
    correlationKey: string,
    tagId: string,
    isTagged: boolean,
  ) {
    if (!isTagged) {
      return await this.websiteModel.updateOne(
        { correlationKey: { $eq: correlationKey } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      return await this.websiteModel.updateOne(
        { correlationKey: { $eq: correlationKey } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  public async merge(mergeInto: string, mergeFrom: string[]) {
    if (!mergeInto || !mergeFrom || mergeFrom.length <= 0)
      throw new HttpBadRequestException('The website ids are invalid');

    const intoObj: Types.ObjectId = new Types.ObjectId(mergeInto);
    const fromObj: Types.ObjectId[] = mergeFrom.map(
      (id) => new Types.ObjectId(id),
    );

    const website: Pick<WebsiteDocument, '_id' | 'projectId'> =
      await this.websiteModel.findOneAndUpdate(
        {
          _id: { $eq: intoObj },
        },
        {
          $set: { mergedInId: null },
        },
        { new: true, projection: '_id projectId' },
      );

    if (!website) {
      throw new HttpBadRequestException(
        'The website to merge into was not found.',
      );
    }

    const relinkPromises: Promise<UpdateResult>[] = [];

    for (let obj of fromObj) {
      relinkPromises.push(
        this.websiteModel
          .updateMany(
            { mergedInId: { $eq: obj }, projectId: { $eq: website.projectId } },
            { $set: { mergedInId: intoObj } },
          )
          .exec(),
      );
    }

    await Promise.all(relinkPromises);

    return await this.websiteModel.updateMany(
      { _id: { $in: fromObj }, projectId: { $eq: website.projectId } },
      { $set: { mergedInId: intoObj } },
    );
  }

  public async unmerge(unmerge: string[]) {
    const idObjs = unmerge.map((id) => new Types.ObjectId(id));
    return await this.websiteModel.updateMany(
      { _id: { $in: idObjs } },
      { $set: { mergedInId: null } },
    );
  }

  private async cleanup(filter: FilterQuery<WebsiteDocument>) {
    const session = await this.websiteModel.startSession();
    const unlinkPromises: Promise<UpdateResult>[] = [];
    let result: DeleteResult = undefined;
    try {
      await session.withTransaction(async () => {
        const websites = await this.websiteModel.find(filter, undefined, {
          session,
        });

        for (let w of websites) {
          unlinkPromises.push(
            this.websiteModel
              .updateMany(
                { mergedInId: { $eq: w._id } },
                { $set: { mergedInId: null } },
                { session: session },
              )
              .exec(),
          );
        }

        await Promise.all(unlinkPromises);

        result = await this.websiteModel.deleteMany(filter, { session });
      });
    } finally {
      await session.endSession();
    }
    return result;
  }

  /**
   * This function cleans up the website collection from all traces of another resource.
   * Mostly useful when a resource is deleted.
   * @param id The resource ID that is deleted
   * @param type The resource's type
   * @returns
   */
  public async cleanUpFor(id: string, type: 'host' | 'domain' | 'port') {
    let filter: FilterQuery<Website>;
    const oid = new Types.ObjectId(id);

    switch (type) {
      case 'domain':
        filter = { 'domain.id': { $eq: oid } };
        break;
      case 'host':
        filter = { 'host.id': { $eq: oid } };
        break;
      case 'port':
        filter = { 'port.id': { $eq: oid } };
        break;
      default:
        return;
    }

    filter.mergedInId;

    return await this.cleanup(filter);
  }
}
