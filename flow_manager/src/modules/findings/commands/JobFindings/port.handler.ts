import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../../database/jobs/jobs.factory';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HttpServerCheckJob } from '../../../database/jobs/models/http-server-check.model';
import { HostService } from '../../../database/reporting/host/host.service';
import { PortService } from '../../../database/reporting/port/port.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { PortCommand } from './port.command';

@CommandHandler(PortCommand)
export class PortHandler extends JobFindingHandlerBase<PortCommand> {
  protected logger: Logger = new Logger('PortHandler');

  constructor(
    private hostService: HostService,
    private portService: PortService,
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
  ) {
    super(jobService, subscriptionsService, customJobsService, configService);
  }

  protected async executeCore(command: PortCommand) {
    const protocol = command.finding.fields.find(
      (x) => x?.key === 'protocol',
    )?.data;

    await this.portService.addPortByIp(
      command.finding.ip,
      command.companyId,
      command.finding.port,
      protocol,
    );

    const job = JobFactory.createJob(HttpServerCheckJob.name, [
      { name: 'companyId', value: command.companyId },
      { name: 'targetIp', value: command.finding.ip },
      { name: 'ports', value: [command.finding.port] },
    ]);
    this.jobsService.publish(job);
  }
}
