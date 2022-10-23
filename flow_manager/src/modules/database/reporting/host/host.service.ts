import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model, Types } from 'mongoose';
import { ConfigService } from '../../admin/config/config.service';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { ReportService } from '../report/report.service';
import { Host } from './host.model';
import { HostSummary } from './host.summary';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private reportService: ReportService,
    private configService: ConfigService,
    private domainService: DomainsService,
  ) {}

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
        id: new Types.ObjectId(domain._id),
      };
      let mongoId = new Types.ObjectId();
      const hostResult = await this.hostModel
        .findOneAndUpdate(
          { ip: { $eq: ip } },
          {
            $setOnInsert: { _id: mongoId, companyId: companyId },
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
          companyId: companyId,
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
      companyId: { $eq: new ObjectId(companyId) },
    });
  }

  public async getHost(id: string) {
    return this.hostModel.findById(id);
  }
}
