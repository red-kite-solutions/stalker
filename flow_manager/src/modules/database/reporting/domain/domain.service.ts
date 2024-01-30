import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpNotFoundException,
  HttpNotImplementedException,
} from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { HostnameFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../job-queue/findings-queue';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { HostService } from '../host/host.service';
import { HostSummary } from '../host/host.summary';
import { Project } from '../project.model';
import { DomainsPagingDto } from './domain.dto';
import { Domain, DomainDocument } from './domain.model';

@Injectable()
export class DomainsService {
  private logger = new Logger(DomainsService.name);

  constructor(
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private jobService: JobsService,
    private configService: ConfigService,
    @Inject(forwardRef(() => HostService))
    private hostService: HostService,
    private findingsQueue: FindingsQueue,
    private tagsService: TagsService,
  ) {}

  /**
   * Add domains to the database.
   * This function will propagate the new domains as findings in the findings queue
   * @param domains
   * @param projectId
   * @returns
   */
  public async addDomains(domains: string[], projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.debug(`Could not find the project (projectId=${projectId})`);
      throw new HttpNotFoundException(`projectId=${projectId}`);
    }

    // for each domain, create a mongo id
    const domainDocuments: DomainDocument[] = [];
    const projectIdObject = new Types.ObjectId(projectId);

    for (const domain of domains) {
      const model = new this.domainModel({
        _id: new Types.ObjectId(),
        name: domain,
        correlationKey: CorrelationKeyUtils.domainCorrelationKey(
          projectIdObject.toString(),
          domain,
        ),
        projectId: projectIdObject,
        lastSeen: Date.now(),
      });
      domainDocuments.push(model);
    }

    let insertedDomains: DomainDocument[] = [];

    // insertmany with ordered false to continue on fail and use the exception
    try {
      insertedDomains = await this.domainModel.insertMany(domainDocuments, {
        ordered: false,
      });
    } catch (err) {
      if (!err.writeErrors) {
        throw err;
      }
      insertedDomains = err.insertedDocs;
    }

    const newDomains: string[] = [];
    for (const domain of insertedDomains) {
      newDomains.push(domain.name);
    }

    const findings: HostnameFinding[] = [];
    // For each new domain name found, a finding is created
    newDomains.forEach((domain) => {
      findings.push({
        type: 'HostnameFinding',
        key: 'HostnameFinding',
        domainName: domain,
        projectId: projectId,
      });
    });
    this.findingsQueue.publish(...findings);

    return insertedDomains;
  }

  /**
   * This function adds a domain to the database if it did not exist. If it existed,
   * the lastSeen value is updated.
   * @param domainName The domain name to add
   * @param projectId The domain's project
   */
  public async addDomain(domainName: string, projectId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.debug(`Could not find the project (projectId=${projectId})`);
      throw new HttpNotFoundException(`projectId=${projectId}`);
    }

    const projectIdObject = new Types.ObjectId(projectId);

    return await this.domainModel.findOneAndUpdate(
      { name: { $eq: domainName }, projectId: { $eq: projectIdObject } },
      {
        lastSeen: Date.now(),
        $setOnInsert: {
          name: domainName,
          correlationKey: CorrelationKeyUtils.domainCorrelationKey(
            projectId,
            domainName,
          ),
          projectId: projectIdObject,
        },
      },
      { upsert: true },
    );
  }

  /**
   * Returns only the domains' name for a domain object
   * @param page
   * @param pageSize
   * @param filter
   * @returns
   */
  public async getDomainNames(
    page: number = null,
    pageSize: number = null,
    filter: any = null,
  ): Promise<Pick<DomainDocument, 'name'>[]> {
    let query;
    const projection = 'name';
    if (filter) {
      query = this.domainModel.find(filter, projection);
    } else {
      query = this.domainModel.find({}, projection);
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async getDomain(id: string): Promise<DomainDocument> {
    return this.domainModel.findById(id);
  }

  public async getDomainByName(name: string): Promise<DomainDocument> {
    return this.domainModel.findOne({ name: { $eq: name } });
  }

  /**
   * Adds hosts summaries to existing domain objects.
   * @param domainId The ID where to add the host summaries
   * @param hostSummaries **Important :** the host summaries must respect the field order defined in the HostSummary interface
   * @returns The result of the update one querry
   */
  public async addHostsToDomain(
    domainId: string,
    hostSummaries: HostSummary[],
  ): Promise<UpdateResult> {
    return this.domainModel.updateOne(
      { _id: { $eq: domainId } },
      { $addToSet: { hosts: { $each: hostSummaries } } },
    );
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.domainModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: any = null,
  ): Promise<DomainDocument[]> {
    let query;
    if (filter) {
      query = this.domainModel.find(filter);
    } else {
      query = this.domainModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async count(filter = null) {
    if (!filter) {
      return await this.domainModel.estimatedDocumentCount();
    } else {
      return await this.domainModel.countDocuments(filter);
    }
  }

  public async editDomain(
    id: string,
    domain: Partial<DomainDocument>,
  ): Promise<UpdateResult> {
    if (domain.tags)
      domain.tags = domain.tags.map((t) => new Types.ObjectId(t));
    if (domain.projectId) {
      const c = await this.projectModel.findById(domain.projectId);
      if (!c) throw new HttpNotFoundException();
      domain.projectId = new Types.ObjectId(domain.projectId);
    }
    if (domain.hosts) throw new HttpNotImplementedException(); // has to validate hosts and unlink
    if (domain.correlationKey) throw new HttpNotImplementedException(); // should not change correlation key
    domain.lastSeen = Date.now();

    return await this.domainModel.updateOne({ _id: { $eq: id } }, domain);
  }

  public async delete(domainId: string): Promise<DeleteResult> {
    const hosts = (await this.domainModel.findById(domainId).select('hosts'))
      ?.hosts;
    if (hosts) {
      for (const host of hosts) {
        this.hostService.unlinkDomain(host.id.toString(), domainId);
      }
    }

    return await this.domainModel.deleteOne({
      _id: { $eq: new Types.ObjectId(domainId) },
    });
  }

  public async deleteMany(domainIds: string[]): Promise<DeleteResult> {
    let deleteResults: DeleteResult;
    for (const id of domainIds) {
      const result = await this.delete(id);
      if (!deleteResults) {
        deleteResults = result;
      } else {
        deleteResults.deletedCount += result.deletedCount;
      }
    }
    return deleteResults;
  }

  public async unlinkHost(
    domainId: string,
    hostId: string,
  ): Promise<UpdateResult> {
    return await this.domainModel.updateOne(
      { _id: { $eq: new Types.ObjectId(domainId) } },
      { $pull: { hosts: { id: { $eq: new Types.ObjectId(hostId) } } } },
    );
  }

  public async tagDomain(
    domainId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const domain = await this.domainModel.findById(domainId);
    if (!domain) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.domainModel.updateOne(
        { _id: { $eq: new Types.ObjectId(domainId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.domainModel.updateOne(
        { _id: { $eq: new Types.ObjectId(domainId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  public buildFilters(dto: DomainsPagingDto) {
    const finalFilter = {};
    // Filter by domain
    if (dto.domain) {
      const preppedDomainArray = dto.domain
        .filter((x) => x)
        .map((x) => x.toLowerCase())
        .map((x) => escapeStringRegexp(x))
        .map((x) => new RegExp(x, 'i'));

      if (preppedDomainArray.length > 0) {
        finalFilter['name'] = { $all: preppedDomainArray };
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
        finalFilter['hosts.ip'] = { $in: hosts };
      }
    }

    // Filter by project
    if (dto.project) {
      finalFilter['projectId'] = {
        $eq: new Types.ObjectId(dto.project),
      };
    }

    // Filter by tag
    if (dto.tags) {
      const preppedTagsArray = dto.tags
        .filter((x) => x)
        .map((x) => x.toLowerCase())
        .map((x) => new Types.ObjectId(x));

      if (preppedTagsArray.length > 0) {
        finalFilter['tags'] = { $all: preppedTagsArray };
      }
    }
    return finalFilter;
  }
}
