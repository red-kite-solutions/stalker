import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../../database/jobs/jobs.factory';
import { JobsService } from '../../../database/jobs/jobs.service';
import { TcpPortScanningJob } from '../../../database/jobs/models/tcp-port-scanning.model';
import { HostService } from '../../../database/reporting/host/host.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { HostnameIpCommand } from './hostname-ip.command';

@CommandHandler(HostnameIpCommand)
export class HostnameIpHandler extends JobFindingHandlerBase<HostnameIpCommand> {
  protected logger: Logger = new Logger('HostnameIpHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
    customJobsService: CustomJobsService,
  ) {
    super(jobService, subscriptionsService, customJobsService);
  }

  protected async executeCore(command: HostnameIpCommand) {
    const newHosts = await this.hostService.addHostsWithDomain(
      [command.finding.ip],
      command.finding.domainName,
      command.companyId,
    );

    for (const host of newHosts) {
      const job = JobFactory.createJob(TcpPortScanningJob.name, [
        { name: 'companyId', value: command.companyId },
        { name: 'targetIp', value: host.ip },
        { name: 'threads', value: 1000 },
        { name: 'socketTimeoutSeconds', value: 0.7 },
        { name: 'portMin', value: 1 },
        { name: 'portMax', value: 65535 },
        { name: 'ports', value: [] },
      ]);

      this.jobsService.publish(job);
    }
  }
}
