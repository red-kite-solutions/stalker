import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { JobExecutionsService } from '../jobs/job-executions.service';
import { SecretsService } from '../secrets/secrets.service';
import { CronSubscription } from '../subscriptions/cron-subscriptions/cron-subscriptions.model';
import { EventSubscriptionsService } from '../subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../subscriptions/subscription-triggers/subscription-triggers.service';
import { DomainsService } from './domain/domain.service';
import { CustomFinding } from './findings/finding.model';
import { HostService } from './host/host.service';
import { IpRangeService } from './ip-ranges/ip-range.service';
import { PortService } from './port/port.service';
import { CreateProjectDto } from './project.dto';
import { Project, ProjectDocument } from './project.model';
import { WebsiteService } from './websites/website.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly jobsService: JobExecutionsService,
    private readonly subscriptionsService: EventSubscriptionsService,
    @InjectModel('cronSubscriptions')
    private readonly cronSubscriptionModel: Model<CronSubscription>,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
    private readonly portsService: PortService,
    private readonly secretsService: SecretsService,
    private readonly websiteService: WebsiteService,
    private readonly triggerService: SubscriptionTriggersService,
    private readonly ipRangeService: IpRangeService,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
  ): Promise<ProjectDocument[]> {
    let query = this.projectModel.find();
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  public async getAllSummaries(
    page: number = null,
    pageSize: number = null,
  ): Promise<Project[]> {
    let query = this.projectModel.find().select('name');
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  public async getAllIds(
    page: number = null,
    pageSize: number = null,
  ): Promise<string[]> {
    let query = this.projectModel.find().select('_id');
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }
    const idObjs = await query;
    const ids = [];
    for (const idObj of idObjs) ids.push(idObj._id.toString());

    return ids;
  }

  /**
   * This method returns the project with the id provided
   * @param id
   * @returns A project object document
   */
  public async get(id: string): Promise<ProjectDocument> {
    return await this.projectModel.findById(id).exec();
  }

  public async addProject(dto: CreateProjectDto) {
    return await new this.projectModel({
      name: dto.name,
      logo: dto.logo ? this.generateFullImage(dto.logo, dto.imageType) : '',
    }).save();
  }

  public async update(id: string, project: Project) {
    await this.projectModel.updateOne({ _id: { $eq: id } }, project);
  }

  public async delete(id: string): Promise<DeleteResult> {
    const result = await this.projectModel.deleteOne({ _id: { $eq: id } });
    await this.hostsService.deleteAllForProject(id);
    await this.domainsService.deleteAllForProject(id);
    await this.jobsService.deleteAllForProject(id);
    await this.subscriptionsService.deleteAllForProject(id);
    await this.portsService.deleteAllForProject(id);
    await this.websiteService.deleteAllForProject(id);
    await this.triggerService.deleteAllForProject(id);
    await this.ipRangeService.deleteAllForProject(id);
    await this.findingModel.deleteMany({
      correlationKey: { $regex: new RegExp(`^project:${id}`) },
    });
    await this.cronSubscriptionModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(id) },
    });
    await this.secretsService.deleteAllForProject(id);
    return result;
  }

  public generateFullImage(b64Content: string, imageType: string) {
    return `data:image/${imageType};base64,${b64Content}`;
  }

  public async editProject(
    id: string,
    project: Partial<Project>,
  ): Promise<UpdateResult> {
    return await this.projectModel.updateOne(
      { _id: { $eq: id } },
      { ...project },
    );
  }
}
