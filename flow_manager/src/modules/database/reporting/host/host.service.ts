import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { CompanyService } from '../company.service';
import { DomainsService } from '../domain/domain.service';
import { DomainSummary } from '../domain/domain.summary';
import { ReportService } from '../report/report.service';
import { SubmitHostDto } from './host.dto';
import { Host } from './host.model';
import { HostSummary } from './host.summary';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private jobService: JobsService,
    private companyService: CompanyService,
    private reportService: ReportService,
    private configService: ConfigService,
    private domainService: DomainsService,
  ) {}

  public async addHostsWithDomainFromJob(dto: SubmitHostDto, jobId: string) {
    const job = await this.jobService.getById(jobId);

    if (!job) {
      this.logger.debug(`Could not find the job ${jobId}`);
      throw new HttpException('The job id is invalid.', 400);
    }

    return this.addHostsWithDomain(dto.ips, dto.domainName, job.companyId);
  }

  public async addHostsWithDomain(
    ips: string[],
    domainName: string,
    companyId: string,
  ) {
    const company = await this.companyService.get(companyId);

    if (!company) {
      this.logger.debug(`Could not find the company ${companyId}`);
      throw new HttpException(
        'The company associated with the given job does not exist.',
        400,
      );
    }

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
            $setOnInsert: { _id: mongoId, companyId: company._id },
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
      this.reportService.addHosts(company.name, newIps, domainName);
    }

    return newHosts;
  }
}
