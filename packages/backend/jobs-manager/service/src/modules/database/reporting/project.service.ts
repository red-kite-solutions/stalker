import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isIP } from 'class-validator';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpBadRequestException } from '../../../exceptions/http.exceptions';
import { JobsService } from '../jobs/jobs.service';
import { SecretsService } from '../secrets/secrets.service';
import { CronSubscription } from '../subscriptions/cron-subscriptions/cron-subscriptions.model';
import { EventSubscriptionsService } from '../subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../subscriptions/subscription-triggers/subscription-triggers.service';
import { DomainsService } from './domain/domain.service';
import { CustomFinding } from './findings/finding.model';
import { HostService } from './host/host.service';
import { PortService } from './port/port.service';
import { CreateProjectDto } from './project.dto';
import { Project, ProjectDocument } from './project.model';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel('project') private readonly projectModel: Model<Project>,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly jobsService: JobsService,
    private readonly subscriptionsService: EventSubscriptionsService,
    @InjectModel('cronSubscriptions')
    private readonly cronSubscriptionModel: Model<CronSubscription>,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
    private readonly portsService: PortService,
    private readonly secretsService: SecretsService,
    private readonly triggerService: SubscriptionTriggersService,
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
    await this.triggerService.deleteAllForProject(id);
    await this.findingModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(id) },
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

  public async getIpRanges(
    id: string,
  ): Promise<Pick<ProjectDocument, 'ipRanges'>> {
    return await this.projectModel.findById(id, 'ipRanges');
  }

  public async addIpRangeWithMask(id: string, ip: string, mask: number) {
    if (0 > mask || mask > 32)
      throw new HttpBadRequestException(
        'Mask of ip range is not between 0 and 32',
      );
    if (!isIP(ip, 4))
      throw new HttpBadRequestException('Ip is not an IPv4 address');

    const range = `${ip}/${mask}`;
    await this.projectModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      { $addToSet: { ipRanges: range } },
    );
  }
}
