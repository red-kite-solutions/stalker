import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import {
  Finding,
  HostnameFinding,
  IpFinding,
  IpRangeFinding,
  PortFinding,
} from '../../../findings/findings.service';
import { ConfigService } from '../../admin/config/config.service';
import { CustomJobsService } from '../../custom-jobs/custom-jobs.service';
import { JobFactory } from '../../jobs/jobs.factory';
import { JobsService } from '../../jobs/jobs.service';
import { Job } from '../../jobs/models/jobs.model';
import { Domain, DomainDocument } from '../../reporting/domain/domain.model';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostDocument } from '../../reporting/host/host.model';
import { HostService } from '../../reporting/host/host.service';
import { Port } from '../../reporting/port/port.model';
import { PortService } from '../../reporting/port/port.service';
import { ProjectDocument } from '../../reporting/project.model';
import { ProjectService } from '../../reporting/project.service';
import { SecretsService } from '../../secrets/secrets.service';
import { CRON_SUBSCRIPTIONS_FILES_PATH } from '../subscriptions.constants';
import { SubscriptionsUtils } from '../subscriptions.utils';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import {
  CronSubscription,
  CronSubscriptionsDocument,
  JobParameter,
} from './cron-subscriptions.model';

@Injectable()
export class CronSubscriptionsService {
  private logger = new Logger(CronSubscriptionsService.name);

  constructor(
    @InjectModel('cronSubscriptions')
    private readonly subscriptionModel: Model<CronSubscription>,
    private readonly projectService: ProjectService,
    private readonly configService: ConfigService,
    private readonly customJobsService: CustomJobsService,
    private readonly jobsService: JobsService,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly portsService: PortService,
    private readonly secretsService: SecretsService,
  ) {}

  public async create(dto: CronSubscriptionDto) {
    const sub: CronSubscription = {
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      isEnabled: dto.isEnabled == null ? dto.isEnabled : true,
      name: dto.name,
      input: dto.input ? dto.input : null,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async updateEnabled(id: string, enabled: boolean) {
    const subUpdate: Partial<CronSubscription> = {
      isEnabled: enabled,
    };

    return await this.subscriptionModel.updateOne<CronSubscription>(
      { _id: { $eq: new Types.ObjectId(id) } },
      subUpdate,
    );
  }

  public async getAll() {
    return await this.subscriptionModel.find({}, '-file');
  }

  public async get(id: string) {
    return await this.subscriptionModel.findOne({ _id: id }, '-file');
  }

  public async edit(
    id: string,
    dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: Partial<CronSubscription> = {
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      name: dto.name,
      input: dto.input ? dto.input : null,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
    };
    return await this.subscriptionModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      sub,
    );
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  /**
   * Launches the job specified in a cron subscription.
   *
   * If no `projectId` is specified in the cron subscription, the job
   * is launched for every project.
   *
   * @param id The cron subscription mongo id
   * @returns
   */
  public async launchCronSubscriptionJob(id: string) {
    const sub: CronSubscriptionsDocument =
      await this.subscriptionModel.findById(id);

    if (!sub) {
      this.logger.warn(
        `Cron subscription id "${id}" does not exist. Could not launch a job from non-existant cron subscription`,
      );
      return;
    }

    if (sub.isEnabled === false) {
      this.logger.warn(
        `Skipping cron subscription "${sub.id}" because it is disabled.`,
      );
      return;
    }

    sub.jobParameters =
      await SubscriptionsUtils.getParametersForCustomJobSubscription(
        sub,
        this.logger,
        this.customJobsService,
        this.configService,
      );

    if (!sub.jobParameters) return;

    await this.setupSubscriptionsForProjects(sub);
  }

  private async setupSubscriptionsForProjects(sub: CronSubscription) {
    // if no project id, it launches for all projects
    const projectIds = sub.projectId
      ? [sub.projectId.toString()]
      : await this.projectService.getAllIds();

    for (const projectId of projectIds) {
      const projectIdParameter = new JobParameter();
      projectIdParameter.name = 'projectId';
      projectIdParameter.value = projectId;
      let subCopy: CronSubscription = <CronSubscription>(
        JSON.parse(JSON.stringify(sub))
      );
      subCopy.jobParameters.push(projectIdParameter);

      if (subCopy.input) {
        this.publishJobsFromInput(subCopy, projectId);
      } else {
        if (
          !SubscriptionsUtils.shouldExecuteFromFinding(
            subCopy.isEnabled,
            subCopy.conditions,
            null,
          )
        )
          continue;
        this.publishJob(subCopy.jobName, subCopy.jobParameters, projectId);
      }
    }
  }

  private async publishJobsFromInput(
    sub: CronSubscription,
    projectId: string,
    pageSize: number = 30,
  ) {
    const now = Date.now();
    const filter = {
      projectId: new Types.ObjectId(projectId),
      createdAt: { $lte: now },
      blocked: { $ne: true },
    };
    const tcpPortFilter: FilterQuery<Port> = {
      projectId: new Types.ObjectId(projectId),
      layer4Protocol: 'tcp',
      createdAt: { $lte: now },
      blocked: { $ne: true },
    };

    let page = 0;
    switch (sub.input) {
      case 'ALL_DOMAINS':
        let domains: Pick<Domain, 'name'>[];
        do {
          domains = await this.domainsService.getDomainNames(
            page,
            pageSize,
            filter,
          );
          this.publishJobsFromDomainsPage(sub, domains, projectId);
          page++;
        } while (domains.length >= pageSize);
        break;
      case 'ALL_HOSTS':
        let hosts: Pick<HostDocument, '_id' | 'ip'>[];
        do {
          hosts = await this.hostsService.getIps(page, pageSize, filter);
          this.publishJobsFromHostsPage(sub, hosts, projectId);
          page++;
        } while (hosts.length >= pageSize);
        break;
      case 'ALL_TCP_PORTS':
        let ports: Pick<Port, 'port' | 'layer4Protocol' | 'host'>[];
        do {
          ports = await this.portsService.getPortNumbers(
            page,
            pageSize,
            tcpPortFilter,
          );
          this.publishJobsFromPortsPage(sub, ports, projectId);
          page++;
        } while (ports.length >= pageSize);
        break;
      case 'ALL_IP_RANGES':
        const ranges = await this.projectService.getIpRanges(projectId);
        this.publishJobsFromIpRanges(sub, ranges, projectId);
        break;
      default:
        this.logger.error(
          `Invalid input type "${sub.input}" for cron subscription "${sub.name}"`,
        );
    }
  }

  private publishJobsFromDomainsPage(
    sub: CronSubscription,
    domains: Pick<DomainDocument, 'name'>[],
    projectId: string,
  ) {
    for (const domain of domains) {
      const finding = new HostnameFinding();
      finding.domainName = domain.name;
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromHostsPage(
    sub: CronSubscription,
    hosts: Pick<HostDocument, 'ip'>[],
    projectId: string,
  ) {
    for (const host of hosts) {
      const finding = new IpFinding();
      finding.ip = host.ip;
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromIpRanges(
    sub: CronSubscription,
    project: Pick<ProjectDocument, 'ipRanges'>,
    projectId: string,
  ) {
    if (!project.ipRanges) return;

    for (const range of project.ipRanges) {
      const finding = new IpRangeFinding();
      const ipMask = range.split('/');
      try {
        finding.ip = ipMask[0];
        finding.mask = Number(ipMask[1]);
      } catch (err) {
        this.logger.error(err);
        this.logger.error(
          `Error while trying to start a job for ip range ${range}`,
        );
        continue;
      }
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromPortsPage(
    sub: CronSubscription,
    ports: Pick<Port, 'port' | 'layer4Protocol' | 'host'>[],
    projectId: string,
  ) {
    for (const port of ports) {
      const finding = new PortFinding();
      finding.ip = port.host.ip;
      finding.port = port.port;
      finding.fields = [
        {
          data: <'tcp' | 'udp'>port.layer4Protocol,
          key: 'protocol',
          label: '',
          type: 'text',
        },
      ];
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobForFinding(
    sub: CronSubscription,
    finding: Finding,
    projectId: string,
  ) {
    if (
      !SubscriptionsUtils.shouldExecuteFromFinding(
        sub.isEnabled,
        sub.conditions,
        finding,
      )
    ) {
      this.logger.debug(
        `Skipping job publication for ${sub.name}; conditions not met or subscription is disabled.`,
      );
      return;
    }

    const parametersCopy: JobParameter[] = JSON.parse(
      JSON.stringify(sub.jobParameters),
    );

    let originalJobParameters = parametersCopy;

    for (const parameter of parametersCopy) {
      if (parameter.name === 'customJobParameters') {
        originalJobParameters = <JobParameter[]>parameter.value;
        break;
      }
    }

    for (const parameter of originalJobParameters) {
      parameter.value = SubscriptionsUtils.replaceValueIfReferingToFinding(
        parameter.value,
        finding,
      );
    }

    this.publishJob(sub.jobName, parametersCopy, projectId);
  }

  private async publishJob(
    jobName: string,
    parameters: JobParameter[],
    projectId: string,
  ) {
    const job: Job = await JobFactory.createJob(
      jobName,
      parameters,
      this.secretsService,
      projectId,
    );
    if (job != null) this.jobsService.publish(job);
  }

  public async revertToDefaults(id: string): Promise<UpdateResult> {
    const sub = await this.subscriptionModel.findById(new Types.ObjectId(id));
    if (!sub) {
      throw new HttpNotFoundException('Subscription not found');
    }

    if (!(sub.builtIn && sub.file)) {
      throw new HttpBadRequestException('Subscription not suitable for revert');
    }

    const defaultSub = SubscriptionsUtils.readCronSubscriptionFile(
      CRON_SUBSCRIPTIONS_FILES_PATH,
      sub.file,
    );

    const subUpdate: Partial<CronSubscription> = {
      name: defaultSub.name,
      jobName: defaultSub.jobName,
      jobParameters: defaultSub.jobParameters,
      cronExpression: defaultSub.cronExpression,
    };

    return await this.subscriptionModel.updateOne(
      { _id: { $eq: sub._id } },
      subUpdate,
    );
  }
}
