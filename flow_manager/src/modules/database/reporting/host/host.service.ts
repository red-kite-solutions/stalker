import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { getTopTcpPorts } from '../../../../utils/ports.utils';
import { ConfigService } from '../../admin/config/config.service';
import { TagsService } from '../../tags/tag.service';
import { Company } from '../company.model';
import { CorrelationKeyUtils } from '../correlation.utils';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { ReportService } from '../report/report.service';
import { HostFilterModel } from './host-filter.model';
import { Host, HostDocument, Port } from './host.model';
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
            $addToSet: { domains: ds, tags: existingTags },
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

  public async tagHost(hostId: string, tagId: string) {
    const host = await this.hostModel.findById(hostId);
    if (host == null) {
      this.logger.debug(`Could not find the host (hostId=${hostId})`);
      throw new HttpNotFoundException(`hostId=${hostId})`);
    }

    const tag = await this.tagsService.getById(tagId);
    if (tag == null) {
      this.logger.debug(`Could not find the tag (tagId=${tagId})`);
      throw new HttpNotFoundException(`tagId=${tagId})`);
    }

    const updatedHost = await this.hostModel.findByIdAndUpdate(hostId, {
      $addToSet: {
        tags: new Types.ObjectId(tagId),
      },
    });

    return updatedHost;
  }

  public async getHostTopTcpPorts(
    id: string,
    page: number,
    pageSize: number,
  ): Promise<number[]> {
    const ports = (await this.hostModel.findById(id).select('ports'))?.ports;

    if (!ports) return [];

    const firstPort = page * pageSize;
    let lastPort = firstPort + pageSize;

    const topPorts = getTopTcpPorts(ports, lastPort);

    if (firstPort >= topPorts.length) return [];

    lastPort = lastPort >= topPorts.length ? topPorts.length : lastPort;
    return topPorts.slice(firstPort, lastPort);
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
      const domainRegexes = [];
      for (const domain of dto.domain) {
        if (domain) {
          let domainRegex = escapeStringRegexp(domain.toLowerCase());
          domainRegexes.push(new RegExp(domainRegex, 'i'));
        }
      }
      if (domainRegexes.length > 0) {
        finalFilter['domains.name'] = { $all: domainRegexes };
      }
    }

    // Filter by company
    if (dto.company) {
      const companiesRegexes = [];
      for (const company of dto.company) {
        if (company) {
          let companyRegex = escapeStringRegexp(company.toLowerCase());
          companiesRegexes.push(new RegExp(companyRegex, 'i'));
        }
      }
      if (companiesRegexes.length > 0) {
        finalFilter['companyName'] = { $all: companiesRegexes };
      }
    }

    // Filter by tag
    if (dto.tags) {
      const preppedTagsArray = [];
      for (const tag of dto.tags) {
        preppedTagsArray.push(new Types.ObjectId(tag));
      }

      finalFilter['tags'] = { $all: preppedTagsArray };
    }
    return finalFilter;
  }

  public async addPortsByIp(
    companyId: string,
    ip: string,
    portNumbers: number[],
  ) {
    const host = await this.hostModel.findOne({
      ip: { $eq: ip },
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
    if (!host) throw new HttpNotFoundException();

    const ports: Port[] = portNumbers.map((port) => ({
      port: port,
      correlationKey: CorrelationKeyUtils.portCorrelationKey(
        companyId,
        ip,
        port,
      ),
    }));

    await this.hostModel.updateOne(
      { ip: { $eq: ip }, companyId: { $eq: new Types.ObjectId(companyId) } },
      { $addToSet: { ports } },
    );

    const newPorts = host.ports
      ? ports.filter(
          (a) =>
            !host.ports.some((b) => {
              return a.port === b.port;
            }),
        )
      : ports;
    return newPorts;
  }
}
