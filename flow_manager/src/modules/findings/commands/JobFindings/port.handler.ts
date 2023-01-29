import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { PortCommand } from './port.command';

@CommandHandler(PortCommand)
export class PortHandler extends JobFindingHandlerBase<PortCommand> {
  protected logger: Logger = new Logger('PortHandler');

  constructor(
    private hostService: HostService,
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
    customJobsService: CustomJobsService,
  ) {
    super(jobService, subscriptionsService, customJobsService);
  }

  protected async executeCore(command: PortCommand) {
    if (
      command.finding.fields.find((x) => x?.key === 'protocol')?.data === 'tcp'
    ) {
      await this.hostService.addPortsByIp(
        command.companyId,
        command.finding.ip,
        [command.finding.port],
      );
    }

    const job = JobsService.createHttpOrHttpsServerCheckJob(
      command.companyId,
      command.finding.ip,
      [command.finding.port],
    );
    this.jobsService.publish(job);
  }
}
