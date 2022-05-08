import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpNotFoundException } from 'src/exceptions/http.exceptions';
import { JobsService } from '../jobs/jobs.service';
import { Job } from '../jobs/models/jobs.model';
import { CreateCompanyDto } from './company.dto';
import { Company, CompanyDocument } from './company.model';
import { DomainsService } from './domain/domain.service';
import { HostService } from './host/host.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel('company') private readonly companyModel: Model<Company>,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly jobsService: JobsService,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
  ): Promise<Company[]> {
    let query = this.companyModel.find();
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  /**
   * This method returns the company with the id provided
   * @param id
   * @returns A company object document
   */
  public async get(id: string): Promise<CompanyDocument> {
    return await this.companyModel.findOne({ _id: { $eq: id } }).exec();
  }

  public async addCompany(dto: CreateCompanyDto) {
    return await new this.companyModel(dto).save();
  }

  public async update(id: string, company: Company) {
    await this.companyModel.updateOne({ _id: { $eq: id } }, company);
  }

  public async delete(id: string) {
    return await this.companyModel.deleteOne({ _id: { $eq: id } });
  }

  public async addDomains(domains: string[], companyId: string) {
    const company = await this.companyModel.findOne({
      _id: { $eq: companyId },
    });
    if (!company) {
      throw new HttpNotFoundException();
    }

    await this.domainsService.addDomains(domains, companyId, company.name);
  }

  public async addDomainsFromJob(
    domains: string[],
    companyId: string,
    jobId: string,
  ) {
    const job = await this.jobsService.getById(jobId);

    if (!job) {
      throw new HttpNotFoundException();
    }

    await this.addDomains(domains, companyId);
  }

  public async addHostsWithDomain(
    ips: string[],
    domainName: string,
    companyId: string,
  ) {
    const company = await this.companyModel.findOne({
      _id: { $eq: companyId },
    });
    if (!company) {
      throw new HttpNotFoundException();
    }

    await this.hostsService.addHostsWithDomain(
      ips,
      domainName,
      companyId,
      company.name,
    );
  }

  public async addHostsWithDomainFromJob(
    ips: string[],
    domainName: string,
    companyId: string,
    jobId: string,
  ) {
    const job = await this.jobsService.getById(jobId);

    if (!job) {
      throw new HttpNotFoundException();
    }

    return this.addHostsWithDomain(ips, domainName, companyId);
  }

  public async publishJob(job: Job) {
    const company = await this.companyModel.findOne({
      _id: { $eq: job.companyId },
    });
    if (!company) {
      throw new HttpNotFoundException();
    }

    return await this.jobsService.publish(job);
  }
}
