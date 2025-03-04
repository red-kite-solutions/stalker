import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../../exceptions/http.exceptions';
import {
  Finding,
  HostnameBatchFinding,
  HostnameFinding,
  IpBatchFinding,
  IpFinding,
  IpRangeBatchFinding,
  IpRangeFinding,
  PortBatchFinding,
  PortFinding,
  WebsiteBatchFinding,
  WebsiteFinding,
} from '../../../findings/findings.service';
import { ConfigService } from '../../admin/config/config.service';
import { CustomJobsService } from '../../custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../jobs/job-executions.service';
import { JobFactory } from '../../jobs/jobs.factory';
import { Job } from '../../jobs/models/jobs.model';
import { CorrelationKeyUtils } from '../../reporting/correlation.utils';
import { Domain, DomainDocument } from '../../reporting/domain/domain.model';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostDocument } from '../../reporting/host/host.model';
import { HostService } from '../../reporting/host/host.service';
import {
  IpRange,
  IpRangeDocument,
} from '../../reporting/ip-ranges/ip-range.model';
import { IpRangeService } from '../../reporting/ip-ranges/ip-range.service';
import { Port } from '../../reporting/port/port.model';
import { PortService } from '../../reporting/port/port.service';
import { ProjectService } from '../../reporting/project.service';
import { WebsiteDocument } from '../../reporting/websites/website.model';
import { WebsiteService } from '../../reporting/websites/website.service';
import { SecretsService } from '../../secrets/secrets.service';
import { SubscriptionTriggersService } from '../subscription-triggers/subscription-triggers.service';
import { JobParameter } from '../subscriptions.type';
import { SubscriptionsUtils } from '../subscriptions.utils';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import {
  CronSubscription,
  CronSubscriptionsDocument,
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
    private readonly jobsService: JobExecutionsService,
    private readonly ipRangesService: IpRangeService,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly portsService: PortService,
    private readonly secretsService: SecretsService,
    private readonly websitesService: WebsiteService,
    private readonly subscriptionTriggerService: SubscriptionTriggersService,
  ) {}

  public async create(dto: CronSubscriptionDto) {
    const sub: CronSubscription = {
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      isEnabled: dto.isEnabled == null ? dto.isEnabled : true,
      name: dto.name,
      input: dto.input ? dto.input : null,
      batch: dto.batch,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
      cooldown: dto.cooldown,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async duplicate(cronSubscriptionId: string) {
    const existingSub = await this.subscriptionModel.findById(
      new Types.ObjectId(cronSubscriptionId),
    );

    if (!existingSub) {
      throw new HttpNotFoundException(
        `EventSubscriptionId=${cronSubscriptionId} not found.`,
      );
    }

    const sub: CronSubscription = {
      conditions: existingSub.conditions,
      isEnabled: existingSub.isEnabled,
      jobName: existingSub.jobName,
      jobParameters: existingSub.jobParameters,
      name: `${existingSub.name} Copy`,
      builtIn: existingSub.builtIn,
      file: existingSub.file,
      projectId: existingSub.projectId,
      cronExpression: existingSub.cronExpression,
      input: existingSub.input,
      batch: existingSub.batch,
      cooldown: existingSub.cooldown,
      source: undefined,
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
      batch: dto.batch ? dto.batch : null,
      cooldown: dto.cooldown ?? null,
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

    await this.setupSubscriptionsForProjects(sub, sub._id.toString());
  }

  private async setupSubscriptionsForProjects(
    sub: CronSubscription,
    subId: string,
  ) {
    // if no project id, it launches for all projects
    const projectIds = sub.projectId
      ? [sub.projectId.toString()]
      : await this.projectService.getAllIds();

    for (const projectId of projectIds) {
      // Check for cooldown readiness
      if (
        sub.cooldown &&
        !(await this.subscriptionTriggerService.attemptTrigger(
          subId,
          CorrelationKeyUtils.generateCorrelationKey(projectId),
          sub.cooldown,
          null,
        ))
      ) {
        continue;
      }

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

    let batchEnabled = false;

    if (sub.batch && sub.batch.enabled) {
      batchEnabled = true;
      pageSize = sub.batch.size ?? null;
    }

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
          if (domains.length) {
            this.publishJobsFromDomainsPage(
              sub,
              domains,
              projectId,
              batchEnabled,
            );
          }
          page++;
        } while (domains.length >= pageSize && pageSize !== null);
        break;
      case 'ALL_HOSTS':
        let hosts: Pick<HostDocument, '_id' | 'ip'>[];
        do {
          hosts = await this.hostsService.getIps(page, pageSize, filter);
          if (hosts.length) {
            this.publishJobsFromHostsPage(sub, hosts, projectId, batchEnabled);
          }
          page++;
        } while (hosts.length >= pageSize && pageSize !== null);
        break;
      case 'ALL_TCP_PORTS':
        let ports: Pick<Port, 'port' | 'layer4Protocol' | 'host'>[];
        do {
          ports = await this.portsService.getPortNumbers(
            page,
            pageSize,
            tcpPortFilter,
          );
          if (ports.length) {
            this.publishJobsFromPortsPage(sub, ports, projectId, batchEnabled);
          }
          page++;
        } while (ports.length >= pageSize && pageSize !== null);
        break;
      case 'ALL_IP_RANGES':
        let ranges: IpRange[] = [];
        do {
          ranges = await this.ipRangesService.getAll(page, pageSize, {
            detailsLevel: 'summary',
          });
          if (ranges.length) {
            this.publishJobsFromIpRanges(sub, ranges, projectId, batchEnabled);
          }
          page++;
        } while (ranges.length >= pageSize && pageSize !== null);
        break;
      case 'ALL_WEBSITES':
        let websites: Pick<
          WebsiteDocument,
          '_id' | 'domain' | 'host' | 'port' | 'path' | 'ssl'
        >[];
        do {
          websites = await this.websitesService.getWebsites(page, pageSize, {
            ...filter,
            mergedInId: { $eq: null },
          });
          if (websites.length) {
            this.publishJobsFromWebsitesPage(
              sub,
              websites,
              projectId,
              batchEnabled,
            );
          }
          page++;
        } while (websites.length >= pageSize && pageSize !== null);
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
    batchEnabled: boolean,
  ) {
    if (!batchEnabled) {
      for (const domain of domains) {
        const finding = new HostnameFinding();
        finding.domainName = domain.name;
        this.publishJobForFinding(sub, finding, projectId);
      }
    } else {
      const finding = new HostnameBatchFinding();
      finding.domainBatch = domains.map((d) => d.name);
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromHostsPage(
    sub: CronSubscription,
    hosts: Pick<HostDocument, 'ip'>[],
    projectId: string,
    batchEnabled: boolean,
  ) {
    if (!batchEnabled) {
      for (const host of hosts) {
        const finding = new IpFinding();
        finding.ip = host.ip;
        this.publishJobForFinding(sub, finding, projectId);
      }
    } else {
      const finding = new IpBatchFinding();
      finding.ipBatch = hosts.map((h) => h.ip);
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromWebsitesPage(
    sub: CronSubscription,
    websites: Pick<
      WebsiteDocument,
      '_id' | 'domain' | 'host' | 'port' | 'path' | 'ssl'
    >[],
    projectId: string,
    batchEnabled: boolean,
  ) {
    if (!batchEnabled) {
      for (const website of websites) {
        const finding = new WebsiteFinding();
        finding.ip = website.host.ip;
        finding.domainName = website.domain?.name ?? '';
        finding.port = website.port.port;
        finding.ssl = website.ssl;
        finding.path = website.path;
        this.publishJobForFinding(sub, finding, projectId);
      }
    } else {
      const finding = new WebsiteBatchFinding();
      for (const website of websites) {
        finding.domainBatch.push(website.domain?.name ?? '');
        finding.ipBatch.push(website.host.ip);
        finding.portBatch.push(website.port.port);
        finding.pathBatch.push(website.path);
        finding.sslBatch.push(website.ssl ?? false);
        finding.protocolBatch.push('tcp');
      }
      this.publishJobForFinding(sub, finding, projectId);
    }
  }

  private publishJobsFromIpRanges(
    sub: CronSubscription,
    ranges: Pick<IpRangeDocument, 'ip' | 'mask'>[],
    projectId: string,
    batchEnabled: boolean,
  ) {
    if (!ranges || !ranges.length) return;

    let batchFinding = new IpRangeBatchFinding();

    if (!batchEnabled) {
      for (const range of ranges) {
        const finding = new IpRangeFinding();
        finding.ip = range.ip;
        finding.mask = range.mask;
        this.publishJobForFinding(sub, finding, projectId);
      }
    } else {
      for (const range of ranges) {
        batchFinding.ipBatch.push(range.ip);
        batchFinding.maskBatch.push(range.mask);
      }
      this.publishJobForFinding(sub, batchFinding, projectId);
    }
  }

  private publishJobsFromPortsPage(
    sub: CronSubscription,
    ports: Pick<Port, 'port' | 'layer4Protocol' | 'host'>[],
    projectId: string,
    batchEnabled: boolean,
  ) {
    if (!batchEnabled) {
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
    } else {
      const finding = new PortBatchFinding();
      for (const p of ports) {
        finding.ipBatch.push(p.host.ip);
        finding.portBatch.push(p.port);
        finding.protocolBatch.push(p.layer4Protocol === 'tcp' ? 'tcp' : 'udp');
      }
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
}
