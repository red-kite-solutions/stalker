import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import { WebsiteFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../job-queue/findings-queue';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Domain } from '../domain/domain.model';
import { DomainSummary } from '../domain/domain.summary';
import { Host } from '../host/host.model';
import { Port } from '../port/port.model';
import { WebsiteFilterModel } from './website-filter.model';
import { Website, WebsiteDocument } from './website.model';

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

  public async addWebsite(
    projectId: string,
    ip: string,
    port: number,
    domain: string = undefined,
    path: string = '/',
  ) {
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

    // Search for a website with the proper port id, domain and path.
    // domain may or may not exist, it depends if it was found in the domains collection
    const searchQuery: FilterQuery<Website> = {
      'port.id': { $eq: existingPort._id },
      'domain.id': {
        $eq: existingDomainSummary ? existingDomainSummary.id : null,
      },
      path: { $eq: path },
    };

    return this.websiteModel.findOneAndUpdate(
      searchQuery,
      {
        $set: { lastSeen: Date.now() },
        $setOnInsert: {
          host: existingPort.host,
          domain: existingDomainSummary ?? null,
          port: { id: existingPort._id, port: existingPort.port },
          path: path,
          sitemap: ['/'],
          projectId: projectIdObj,
          correlationKey: CorrelationKeyUtils.websiteCorrelationKey(
            projectId,
            ip,
            port,
            existingDomainSummary ? existingDomainSummary.name : '',
            path,
          ),
        },
      },
      { upsert: true, new: true },
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

    const websiteFindingBase: Omit<WebsiteFinding, 'domain'> = {
      type: 'WebsiteFinding',
      key: 'WebsiteFinding',
      ip: ip,
      path: path,
      port: port,
      fields: [],
    };

    // We will create a website finding
    let findings: WebsiteFinding[] = [
      {
        domain: '',
        ...websiteFindingBase,
      },
    ];

    for (const domainSummary of host.domains) {
      findings.push({
        domain: domainSummary.name,
        ...websiteFindingBase,
      });

      if (findings.length >= 10) {
        await this.findingsQueue.publish(...findings);
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
    return await this.websiteModel.deleteOne({
      _id: { $eq: new Types.ObjectId(websiteId) },
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
      query = this.websiteModel.find(this.buildFilters(filter));
    } else {
      query = this.websiteModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  private async buildFilters(filter: WebsiteFilterModel) {
    throw new NotImplementedException();
  }

  public async keyIsBlocked(correlationKey: string) {
    const website = await this.websiteModel.findOne(
      { correlationKey: { $eq: correlationKey } },
      'blocked mergedInId',
    );
    return website && (!!website.mergedInId || website.blocked);
  }

  /**
   * TODO:
   *
   * When a host is deleted:
   *  delete the websites for the host
   *  unlink the host if in alternative hosts
   * When a domain is deleted:
   *   delete the websites for the domain
   *   unlink the domain if in alternative domains
   * When a port is deleted:
   *   delete the websites for the port
   *   unlink the port if in alternative ports
   */
}
