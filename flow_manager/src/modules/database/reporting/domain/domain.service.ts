import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { CompanyService } from '../company.service';
import { HostSummary } from '../host/host.summary';
import { ReportService } from '../report/report.service';
import { SubmitDomainDto, SubmitDomainManuallyDto } from './domain.dto';
import { Domain, DomainDocument } from './domain.model';

@Injectable()
export class DomainsService {
  constructor(
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    private jobService: JobsService,
    private companyService: CompanyService,
    private reportService: ReportService,
    private configService: ConfigService,
  ) {}

  private async addDomainsToCompany(domains: string[], companyId: string) {
    const company = await this.companyService.get(companyId);

    if (!company?._id) {
      throw new HttpException('The company does not exist.', 400);
    }

    // for each doman, create a mongo id
    const domainDocuments: DomainDocument[] = [];
    domains.forEach((domain) => {
      const model = new this.domainModel({
        _id: new Types.ObjectId(),
        name: domain,
        companyId: new Types.ObjectId(companyId),
      });
      domainDocuments.push(model);
    });

    let insertedDomains: any = [];

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
    insertedDomains.forEach((domain: DomainDocument) => {
      newDomains.push(domain.name);
    });

    if (this.configService.config.IsNewContentReported) {
      this.reportService.addDomains(company.name, newDomains);
    }

    // For each new domain name found, create a domain name resolution job for the domain
    newDomains.forEach((domain) => {
      const job = this.jobService.createDomainResolvingJob(companyId, domain);
      this.jobService.publish(job);
    });
  }

  public async addDomainsFromJob(dto: SubmitDomainDto, jobId: string) {
    // Find the proper program using the jobId and then the program name
    const job = await this.jobService.getById(jobId);

    if (!job) {
      throw new HttpException('The job id is invalid.', 400);
    }

    await this.addDomainsToCompany(dto.subdomains, job.companyId);
  }

  public async addDomains(dto: SubmitDomainManuallyDto) {
    await this.addDomainsToCompany(dto.subdomains, dto.companyId);
  }

  public async getDomain(id: string): Promise<DomainDocument> {
    return this.domainModel.findById(id);
  }

  public async getDomainByName(name: string): Promise<DomainDocument> {
    return this.domainModel.findOne({ name: { $eq: name } });
  }

  public async addHostsToDomain(
    domainId: string,
    hostSummaries: HostSummary[],
  ) {
    return this.domainModel.updateOne(
      { _id: { $eq: domainId } },
      { $addToSet: { hosts: { $each: hostSummaries } } },
    );
  }

  /**
   * Starts a job for every domain name trying to resolve them to one
   * or many IP addresses
   */
  public async resolveAll() {
    let page = -1;
    let pageSize = 100;

    let domains: DomainDocument[] = [];
    do {
      page++;
      let query = this.domainModel.find();
      query = query.skip(page).limit(pageSize);
      domains = await query.exec();

      domains.forEach((domain) => {
        const job = this.jobService.createDomainResolvingJob(
          domain.companyId.toString(),
          domain.name,
        );
        this.jobService.publish(job);
      });
    } while (domains);

    return;
  }
}
