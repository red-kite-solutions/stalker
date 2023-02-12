import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../../database/jobs/jobs.factory';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HttpServerCheckJob } from '../../../database/jobs/models/http-server-check.model';
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

    const job = JobFactory.createJob(HttpServerCheckJob.name, [
      { name: 'companyId', value: command.companyId },
      { name: 'targetIp', value: command.finding.ip },
      { name: 'ports', value: [command.finding.port] },
    ]);
    this.jobsService.publish(job);
  }
}
