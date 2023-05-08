import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../exceptions/http.exceptions';
import { JobsService } from '../jobs/jobs.service';
import { Job } from '../jobs/models/jobs.model';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCompanyDto } from './company.dto';
import { Company, CompanyDocument } from './company.model';
import { DomainsService } from './domain/domain.service';
import { CustomFinding } from './findings/finding.model';
import { HostService } from './host/host.service';
import { PortService } from './port/port.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel('company') private readonly companyModel: Model<Company>,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly jobsService: JobsService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
    private readonly portsService: PortService,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
  ): Promise<CompanyDocument[]> {
    let query = this.companyModel.find();
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  public async getAllSummaries(
    page: number = null,
    pageSize: number = null,
  ): Promise<Company[]> {
    let query = this.companyModel.find().select('name');
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
    return await this.companyModel.findById(id).exec();
  }

  public async addCompany(dto: CreateCompanyDto) {
    return await new this.companyModel({
      name: dto.name,
      logo: dto.logo ? this.generateFullImage(dto.logo, dto.imageType) : '',
    }).save();
  }

  public async update(id: string, company: Company) {
    await this.companyModel.updateOne({ _id: { $eq: id } }, company);
  }

  public async delete(id: string): Promise<DeleteResult> {
    const result = await this.companyModel.deleteOne({ _id: { $eq: id } });
    await this.hostsService.deleteAllForCompany(id);
    await this.domainsService.deleteAllForCompany(id);
    await this.jobsService.deleteAllForCompany(id);
    await this.subscriptionsService.deleteAllForCompany(id);
    await this.portsService.deleteAllForCompany(id);
    await this.findingModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(id) },
    });
    return result;
  }

  public async addDomains(domains: string[], companyId: string) {
    const company = await this.companyModel.findOne({
      _id: { $eq: companyId },
    });
    if (!company) {
      throw new HttpNotFoundException();
    }

    return await this.domainsService.addDomains(domains, companyId);
  }

  public async addHosts(hosts: string[], companyId: string) {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new HttpNotFoundException();
    }

    return await this.hostsService.addHosts(hosts, companyId, company.name);
  }

  public async addHostsWithDomain(
    ips: string[],
    domainName: string,
    companyId: string,
  ) {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new HttpNotFoundException();
    }

    await this.hostsService.addHostsWithDomain(ips, domainName, companyId, []);
  }

  public async publishJob(job: Job) {
    const company = await this.companyModel.findById(job.companyId);
    if (!company) {
      throw new HttpNotFoundException();
    }

    return await this.jobsService.publish(job);
  }

  public generateFullImage(b64Content: string, imageType: string) {
    return `data:image/${imageType};base64,${b64Content}`;
  }

  public async editCompany(
    id: string,
    company: Partial<Company>,
  ): Promise<UpdateResult> {
    return await this.companyModel.updateOne(
      { _id: { $eq: id } },
      { ...company },
    );
  }
}
