import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../../database/jobs/jobs.factory';
import { JobsService } from '../../../database/jobs/jobs.service';
import { DomainNameResolvingJob } from '../../../database/jobs/models/domain-name-resolving.model';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { HostnameCommand } from './hostname.command';

@CommandHandler(HostnameCommand)
export class HostnameHandler extends UserFindingHandlerBase<HostnameCommand> {
  protected logger: Logger = new Logger('HostnameHandler');

  constructor(
    jobService: JobsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
  ) {
    super(
      subscriptionsService,
      jobService,
      customJobsService,
      configService,
      subscriptionTriggersService,
    );
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
