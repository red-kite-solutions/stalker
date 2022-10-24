import {
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { getTopTcpPorts } from 'src/utils/ports.utils';
import { ConfigService } from '../../admin/config/config.service';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { ReportService } from '../report/report.service';
import { Host, HostDocument } from './host.model';
import { HostSummary } from './host.summary';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private reportService: ReportService,
    private configService: ConfigService,
    @Inject(forwardRef(() => DomainsService))
    private domainService: DomainsService,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: any = null,
  ): Promise<HostDocument[]> {
    let query;
    if (filter) {
      query = this.hostModel.find(filter);
    } else {
      query = this.hostModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async count(filter = null) {
    if (!filter) {
      return await this.hostModel.estimatedDocumentCount();
    } else {
      return await this.hostModel.countDocuments(filter);
    }
  }

  public async addHostsWithDomain(
    ips: string[],
    domainName: string,
    companyId: string,
    companyName,
  ) {
    const domain = await this.domainService.getDomainByName(domainName);

    if (!domain) {
      this.logger.debug(`Could not find the domain ${domainName}`);
      throw new HttpException(
        'The domain associated with the given job does not exist.',
        400,
      );
    }

    let hostSummaries: HostSummary[] = [];
    let newIps: string[] = [];
    let newHosts = [];

    for (let ip of ips) {
      const ds: DomainSummary = {
        name: domain.name,
        id: domain._id,
      };
      let mongoId = new Types.ObjectId();
      const hostResult = await this.hostModel
        .findOneAndUpdate(
          { ip: { $eq: ip }, companyId: { $eq: companyId } },
          {
            $setOnInsert: {
              _id: mongoId,
              companyId: new Types.ObjectId(companyId),
            },
            $addToSet: { domains: ds },
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
          domainName: domainName,
          companyId: new Types.ObjectId(companyId),
        });
        hostSummaries.push({ id: mongoId, ip: ip });
      } else if (
        !hostResult.domains ||
        hostResult.domains.some((ds) => ds.name === domainName)
      ) {
        // updated, so sync with relevant domain document must be done
        hostSummaries.push({ id: hostResult._id, ip: ip });
      }
    }
    const config = await this.configService.getConfig();

    await this.domainService.addHostsToDomain(domain._id, hostSummaries);

    if (config.isNewContentReported) {
      this.reportService.addHosts(companyName, newIps, domainName);
    }

    return newHosts;
  }

  public async deleteAllForCompany(companyId: string) {
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
        companyId: companyId,
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

  public async getHostTopTcpPorts(id: string, top: number): Promise<number[]> {
    const ports = (await this.hostModel.findById(id).select('ports'))?.ports;

    if (!ports) return [];

    return getTopTcpPorts(ports, top);
  }

  public async delete(hostId: string) {
    const domains = (await this.hostModel.findById(hostId).select('domains'))
      ?.domains;
    if (domains) {
      for (const domain of domains) {
        this.domainService.unlinkHost(domain.id.toString(), hostId);
      }
    }

    return await this.hostModel.deleteOne({ _id: { $eq: hostId } });
  }

  public async unlinkDomain(hostId: string, domainId: string) {
    return await this.hostModel.updateOne(
      { _id: { $eq: new Types.ObjectId(hostId) } },
      { $pull: { domains: { id: new Types.ObjectId(domainId) } } },
    );
  }
}
