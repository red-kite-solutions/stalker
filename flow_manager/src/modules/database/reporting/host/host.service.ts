import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { ConfigService } from '../../admin/config/config.service';
import { TagsService } from '../../tags/tag.service';
import { Company } from '../company.model';
import { CorrelationKeyUtils } from '../correlation.utils';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { ReportService } from '../report/report.service';
import { HostFilterModel } from './host-filter.model';
import { Host, HostDocument } from './host.model';
import { HostSummary } from './host.summary';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    @InjectModel('company') private readonly companyModel: Model<Company>,
    private reportService: ReportService,
    private configService: ConfigService,
    private tagsService: TagsService,
    @Inject(forwardRef(() => DomainsService))
    private domainService: DomainsService,
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
    companyId: string,
    tagsIds: string[] = [],
  ) {
    const domain = await this.domainService.getDomainByName(domainName);
    if (!domain) {
      this.logger.debug(`Could not find the domain (domainName=${domainName})`);
      throw new HttpNotFoundException(`domainName=${domainName})`);
    }

    const company = await this.companyModel.findById(companyId);
    if (!company) {
      this.logger.debug(`Could not find the company (companyId=${companyId})`);
      throw new HttpNotFoundException(`companyId=${companyId}`);
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
            companyId: { $eq: new Types.ObjectId(companyId) },
          },
          {
            $setOnInsert: {
              _id: mongoId,
              companyId: new Types.ObjectId(companyId),
              companyName: company.name,
              correlationKey: CorrelationKeyUtils.hostCorrelationKey(
                companyId,
                ip,
              ),
            },
            $addToSet: { domains: ds, tags: { $each: existingTags } },
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
          companyId: new Types.ObjectId(companyId),
          correlationKey: CorrelationKeyUtils.hostCorrelationKey(companyId, ip),
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
    const config = await this.configService.getConfig();

    await this.domainService.addHostsToDomain(domain._id, hostSummaries);

    if (config.isNewContentReported) {
      this.reportService.addHosts(company.name, newIps, domainName);
    }

    return newHosts;
  }

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.hostModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }

  public async getHost(id: string) {
    return this.hostModel.findById(id);
  }

  public async addHosts(
    hosts: string[],
    companyId: string,
    companyName: string,
  ) {
    const hostDocuments: HostDocument[] = [];
    for (let ip of hosts) {
      const model = new this.hostModel({
        _id: new Types.ObjectId(),
        ip: ip,
        companyId: new Types.ObjectId(companyId),
        correlationKey: CorrelationKeyUtils.hostCorrelationKey(companyId, ip),
      });

      hostDocuments.push(model);
    }

    let insertedHosts: any = [];

    // insertmany with ordered false to continue on fail and use the exception
    try {
      insertedHosts = await this.hostModel.insertMany(hostDocuments, {
        ordered: false,
      });
    } catch (err) {
      if (!err.writeErrors) {
        throw err;
      }
      console.log(err);
      insertedHosts = err.insertedDocs;
    }

    const newIps: string[] = [];
    insertedHosts.forEach((host: HostDocument) => {
      newIps.push(host.ip);
    });

    const config = await this.configService.getConfig();

    if (config.isNewContentReported) {
      this.reportService.addHosts(companyName, newIps);
    }

    return insertedHosts;
  }

  public async delete(hostId: string): Promise<DeleteResult> {
    const domains = (await this.hostModel.findById(hostId).select('domains'))
      ?.domains;
    if (domains) {
      for (const domain of domains) {
        this.domainService.unlinkHost(domain.id.toString(), hostId);
      }
    }

    return await this.hostModel.deleteOne({ _id: { $eq: hostId } });
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
      const hosts = dto.host.filter((x) => x).map((x) => x.toLowerCase());

      if (hosts.length > 0) {
        finalFilter['ip'] = { $in: hosts };
      }
    }

    // Filter by company
    if (dto.company) {
      const companiesRegexes = dto.company
        .filter((x) => x)
        .map((x) => x.toLowerCase())
        .map((x) => escapeStringRegexp(x));

      if (companiesRegexes.length > 0) {
        finalFilter['companyName'] = { $all: companiesRegexes };
      }
    }

    // Filter by tag
    if (dto.tags) {
      const preppedTagsArray = dto.tags.map((x) => new Types.ObjectId(x));
      finalFilter['tags'] = { $all: preppedTagsArray };
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
}
