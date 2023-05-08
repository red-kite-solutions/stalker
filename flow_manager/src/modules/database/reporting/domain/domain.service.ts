import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpNotFoundException,
  HttpNotImplementedException,
} from '../../../../exceptions/http.exceptions';
import { HostnameFinding } from '../../../findings/findings.service';
import { FindingsQueue } from '../../../job-queue/findings-queue';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { TagsService } from '../../tags/tag.service';
import { Company } from '../company.model';
import { CorrelationKeyUtils } from '../correlation.utils';
import { HostService } from '../host/host.service';
import { HostSummary } from '../host/host.summary';
import { ReportService } from '../report/report.service';
import { Domain, DomainDocument } from './domain.model';

@Injectable()
export class DomainsService {
  private logger = new Logger(DomainsService.name);

  constructor(
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    @InjectModel('company') private readonly companyModel: Model<Company>,
    private jobService: JobsService,
    private reportService: ReportService,
    private configService: ConfigService,
    @Inject(forwardRef(() => HostService))
    private hostService: HostService,
    private findingsQueue: FindingsQueue,
    private tagsService: TagsService,
  ) {}

  public async addDomains(domains: string[], companyId: string) {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      this.logger.debug(`Could not find the company (companyId=${companyId})`);
      throw new HttpNotFoundException(`companyId=${companyId}`);
    }

    // for each domain, create a mongo id
    const domainDocuments: DomainDocument[] = [];
    const companyIdObject = new Types.ObjectId(companyId);
    domains.forEach((domain) => {
      const model = new this.domainModel({
        _id: new Types.ObjectId(),
        name: domain,
        correlationKey: CorrelationKeyUtils.domainCorrelationKey(
          companyIdObject.toString(),
          domain,
        ),
        companyId: companyIdObject,
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

    const config = await this.configService.getConfig();

    if (config?.isNewContentReported) {
      this.reportService.addDomains(company.name, newDomains);
    }

    const findings: HostnameFinding[] = [];
    // For each new domain name found, a finding is created
    newDomains.forEach((domain) => {
      findings.push({
        type: 'HostnameFinding',
        key: 'HostnameFinding',
        domainName: domain,
        companyId: companyId,
      });
    });
    this.findingsQueue.publish(...findings);

    return insertedDomains;
  }

  public async getDomain(id: string): Promise<DomainDocument> {
    return this.domainModel.findById(id);
  }

  public async getDomainByName(name: string): Promise<DomainDocument> {
    return this.domainModel.findOne({ name: { $eq: name } });
  }

  /**
   * Adds hosts summaries to existing domain objects.
   * @param domainId The ID where to add the host summaries
   * @param hostSummaries **Important :** the host summaries must respect the field order defined in the HostSummary interface
   * @returns The result of the update one querry
   */
  public async addHostsToDomain(
    domainId: string,
    hostSummaries: HostSummary[],
  ): Promise<UpdateResult> {
    return this.domainModel.updateOne(
      { _id: { $eq: domainId } },
      { $addToSet: { hosts: { $each: hostSummaries } } },
    );
  }

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.domainModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: any = null,
  ): Promise<DomainDocument[]> {
    let query;
    if (filter) {
      query = this.domainModel.find(filter);
    } else {
      query = this.domainModel.find({});
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async count(filter = null) {
    if (!filter) {
      return await this.domainModel.estimatedDocumentCount();
    } else {
      return await this.domainModel.countDocuments(filter);
    }
  }

  public async editDomain(
    id: string,
    domain: Partial<DomainDocument>,
  ): Promise<UpdateResult> {
    if (domain.tags)
      domain.tags = domain.tags.map((t) => new Types.ObjectId(t));
    if (domain.companyId) {
      const c = await this.companyModel.findById(domain.companyId);
      if (!c) throw new HttpNotFoundException();
      domain.companyId = new Types.ObjectId(domain.companyId);
    }
    if (domain.hosts) throw new HttpNotImplementedException(); // has to validate hosts and unlink
    if (domain.correlationKey) throw new HttpNotImplementedException(); // should not change correlation key

    return await this.domainModel.updateOne({ _id: { $eq: id } }, domain);
  }

  public async delete(domainId: string): Promise<DeleteResult> {
    const hosts = (await this.domainModel.findById(domainId).select('hosts'))
      ?.hosts;
    if (hosts) {
      for (const host of hosts) {
        this.hostService.unlinkDomain(host.id.toString(), domainId);
      }
    }

    return await this.domainModel.deleteOne({ _id: { $eq: domainId } });
  }

  public async unlinkHost(
    domainId: string,
    hostId: string,
  ): Promise<UpdateResult> {
    console.log('domain Id: ' + domainId);
    console.log('host Id: ' + hostId);

    return await this.domainModel.updateOne(
      { _id: { $eq: new Types.ObjectId(domainId) } },
      { $pull: { hosts: { id: { $eq: new Types.ObjectId(hostId) } } } },
    );
  }

  public async tagDomain(
    domainId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const domain = await this.domainModel.findById(domainId);
    if (!domain) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.domainModel.updateOne(
        { _id: { $eq: new Types.ObjectId(domainId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.domainModel.updateOne(
        { _id: { $eq: new Types.ObjectId(domainId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }
}
