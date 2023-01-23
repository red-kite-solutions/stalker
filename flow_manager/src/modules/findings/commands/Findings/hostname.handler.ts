import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../../database/jobs/jobs.factory';
import { JobsService } from '../../../database/jobs/jobs.service';
import { DomainNameResolvingJob } from '../../../database/jobs/models/domain-name-resolving.model';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends UserFindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor(
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
    customJobsService: CustomJobsService,
  ) {
    super(subscriptionsService, jobService, customJobsService);
  }

  protected async executeCore(command: HostnameCommand) {
    // Launch a domain name resolving job
    const job = JobFactory.createJob(DomainNameResolvingJob.name, [
      { name: 'companyId', value: command.companyId },
      { name: 'domainName', value: command.finding.domainName },
    ]);

    this.jobsService.publish(job);
  }
}
