import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../../database/jobs/jobs.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends UserFindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor(
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
  ) {
    super(subscriptionsService, jobService);
  }

  protected async executeCore(command: HostnameCommand) {
    // Launch a domain name resolving job
    const job = JobsService.createDomainResolvingJob(
      command.companyId,
      command.domainName,
    );
    this.jobsService.publish(job);
  }
}
