import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
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
      const job = JobsService.createSimpleTcpScanAllPortsJob(
        command.companyId,
        host.ip,
      );
      this.jobsService.publish(job);
    }
  }
}
