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
import { CustomJob } from '../../jobs/models/custom-job.model';
import { Job } from '../../jobs/models/jobs.model';
import { CompanyDocument } from '../../reporting/company.model';
import { CompanyService } from '../../reporting/company.service';
import { Domain, DomainDocument } from '../../reporting/domain/domain.model';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostDocument } from '../../reporting/host/host.model';
import { HostService } from '../../reporting/host/host.service';
import { Port } from '../../reporting/port/port.model';
import { PortService } from '../../reporting/port/port.service';
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
    private readonly companyService: CompanyService,
    private readonly configService: ConfigService,
    private readonly customJobsService: CustomJobsService,
    private readonly jobsService: JobsService,
    private readonly domainsService: DomainsService,
    private readonly hostsService: HostService,
    private readonly portsService: PortService,
  ) {}

  public async create(dto: CronSubscriptionDto) {
    const sub: CronSubscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      input: dto.input ? dto.input : null,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
      conditions: dto.conditions,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async getAll() {
    return await this.subscriptionModel.find({}, '-file');
  }

  public async edit(
    id: string,
    dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: Partial<CronSubscription> = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
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

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }

  /**
   * Launches the job specified in a cron subscription.
   *
   * If no `companyId` is specified in the cron subscription, the job
   * is launched for every company.
   *
   * @param id The cron subscription mongo id
   * @returns
   */
  public async launchCronSubscriptionJob(id: string) {
    const sub: CronSubscriptionsDocument =
      await this.subscriptionModel.findById(id);

    if (!sub) {
      this.logger.warn(
        `Cron subscription id '${id}' does not exist. Could not launch a job from non-existant cron subscription`,
      );
      return;
    }

    if (sub.jobName === CustomJob.name) {
      sub.jobParameters =
        await SubscriptionsUtils.getParametersForCustomJobSubscription(
          sub,
          this.logger,
          this.customJobsService,
          this.configService,
        );

      if (!sub.jobParameters) return;
    }

    // if no company id, it launches for all companies
    const companyIds = sub.companyId
      ? [sub.companyId.toString()]
      : await this.companyService.getAllIds();

    for (const companyId of companyIds) {
      const companyIdParameter = new JobParameter();
      companyIdParameter.name = 'companyId';
      companyIdParameter.value = companyId;
      let subCopy: CronSubscription = <CronSubscription>(
        JSON.parse(JSON.stringify(sub))
      );
      subCopy.jobParameters.push(companyIdParameter);

      if (subCopy.input) {
        this.publishJobsFromInput(subCopy, companyId);
      } else {
        for (const condition of subCopy.conditions ?? []) {
          if (!SubscriptionsUtils.evaluateCondition(condition)) continue;
        }
        this.publishJob(subCopy.jobName, subCopy.jobParameters);
      }
    }
  }

  private async publishJobsFromInput(
    sub: CronSubscription,
    companyId: string,
    pageSize: number = 100,
  ) {
    const now = Date.now();
    const filter = {
      companyId: new Types.ObjectId(companyId),
      createdAt: { $lte: now },
    };
    const tcpPortFilter: FilterQuery<Port> = {
      hostId: { $eq: '' },
      layer4Protocol: 'tcp',
      createdAt: { $lte: now },
    };

    let page = 0;
    let hosts: Pick<HostDocument, '_id' | 'ip'>[];
    switch (sub.input) {
      case 'ALL_DOMAINS':
        let domains: Pick<Domain, 'name'>[];
        do {
          domains = await this.domainsService.getDomainNames(
            page,
            pageSize,
            filter,
          );
          this.publishJobsFromDomainsPage(sub, domains);
          page++;
        } while (domains.length >= pageSize);
        break;
      case 'ALL_HOSTS':
        do {
          hosts = await this.hostsService.getIps(page, pageSize, filter);
          this.publishJobsFromHostsPage(sub, hosts);
          page++;
        } while (hosts.length >= pageSize);
        break;
      case 'ALL_TCP_PORTS':
        do {
          let ports: Pick<Port, 'port' | 'layer4Protocol'>[];
          hosts = await this.hostsService.getIps(page, pageSize, filter);
          for (const host of hosts) {
            let portPage = 0;
            do {
              tcpPortFilter.hostId = { $eq: host._id };
              ports = await this.portsService.getPortNumbers(
                portPage,
                pageSize,
                tcpPortFilter,
              );
              this.publishJobsFromPortsPage(sub, ports, host.ip);
              portPage++;
            } while (ports.length >= pageSize);
          }
          page++;
        } while (hosts.length >= pageSize);
        break;
      case 'ALL_IP_RANGES':
        const ranges = await this.companyService.getIpRanges(companyId);
        this.publishJobsFromIpRanges(sub, ranges);
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
  ) {
    for (const domain of domains) {
      const finding = new HostnameFinding();
      finding.domainName = domain.name;
      this.publishJobForFinding(sub, finding);
    }
  }

  private publishJobsFromHostsPage(
    sub: CronSubscription,
    hosts: Pick<HostDocument, 'ip'>[],
  ) {
    for (const host of hosts) {
      const finding = new IpFinding();
      finding.ip = host.ip;
      this.publishJobForFinding(sub, finding);
    }
  }

  private publishJobsFromIpRanges(
    sub: CronSubscription,
    company: Pick<CompanyDocument, 'ipRanges'>,
  ) {
    if (!company.ipRanges) return;

    for (const range of company.ipRanges) {
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
      this.publishJobForFinding(sub, finding);
    }
  }

  private publishJobsFromPortsPage(
    sub: CronSubscription,
    ports: Pick<Port, 'port' | 'layer4Protocol'>[],
    ip: string,
  ) {
    for (const port of ports) {
      const finding = new PortFinding();
      finding.ip = ip;
      finding.port = port.port;
      finding.fields = [
        {
          data: <'tcp' | 'udp'>port.layer4Protocol,
          key: 'protocol',
          label: '',
          type: 'text',
        },
      ];
      this.publishJobForFinding(sub, finding);
    }
  }

  private publishJobForFinding(sub: CronSubscription, finding: Finding) {
    if (!SubscriptionsUtils.shouldExecuteFromFinding(sub.conditions, finding))
      return;

    const parametersCopy: JobParameter[] = JSON.parse(
      JSON.stringify(sub.jobParameters),
    );

    let originalJobParameters = parametersCopy;
    if (sub.jobName === CustomJob.name) {
      for (const parameter of parametersCopy) {
        if (parameter.name === 'customJobParameters') {
          originalJobParameters = <JobParameter[]>parameter.value;
          break;
        }
      }
    }

    for (const parameter of originalJobParameters) {
      parameter.value = SubscriptionsUtils.replaceValueIfReferingToFinding(
        parameter.value,
        finding,
      );
    }

    this.publishJob(sub.jobName, parametersCopy);
  }

  private publishJob(jobName: string, parameters: JobParameter[]) {
    const job: Job = JobFactory.createJob(jobName, parameters);
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
