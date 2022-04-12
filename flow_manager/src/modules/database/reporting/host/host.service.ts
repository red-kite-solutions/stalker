import { HttpException, Injectable } from '@nestjs/common';
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
      console.log('Could not find the job ' + jobId);
      throw new HttpException('The job id is invalid.', 400);
    }

    const company = await this.companyService.get(job.companyId);

    if (!company) {
      console.log('Could not find the company ' + job.companyId);
      throw new HttpException(
        'The company associated with the given job does not exist.',
        400,
      );
    }

    const domain = await this.domainService.getDomainByName(dto.domainName);

    if (!domain) {
      console.log('Could not find the domain ' + dto.domainName);
      throw new HttpException(
        'The domain associated with the given job does not exist.',
        400,
      );
    }

    let hostSummaries: HostSummary[] = [];
    dto.ips.forEach(async (ip) => {
      const ds: DomainSummary = {
        name: domain.name,
        id: new Types.ObjectId(domain._id),
      };
      const hostResult = await this.hostModel
        .updateOne(
          { ip: { $eq: ip } },
          { companyId: company._id, $addToSet: { domains: ds } },
          { upsert: true },
        )
        .exec();
      console.log('after host upsert addtoset, result: ');
      console.log(hostResult);

      hostSummaries.push({ ip: ip, id: hostResult.upserted[0]._id });
    });

    await this.domainService.addHostsToDomain(domain._id, hostSummaries);

    // TODO: Here it adds all the ips no matter what, but it should
    // only send the actual new ips to be reported
    if (this.configService.config.IsNewContentReported) {
      this.reportService.addHosts(company.name, dto.ips, dto.domainName);
    }
  }
}
