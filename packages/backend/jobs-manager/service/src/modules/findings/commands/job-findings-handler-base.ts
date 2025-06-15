import { ConfigService } from '../../database/admin/config/config.service';
import { CustomJobsService } from '../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../database/jobs/job-executions.service';
import { SecretsService } from '../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { FindingHandlerBase } from './findings-handler-base';
import { JobFindingCommand } from './findings.command';

// implements ICommandHandler<T>
export abstract class JobFindingHandlerBase<
  T extends JobFindingCommand,
> extends FindingHandlerBase<T> {
  constructor(
    jobService: JobExecutionsService,
    subscriptionService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
  ) {
    super(
      subscriptionService,
      jobService,
      customJobsService,
      configService,
      subscriptionTriggersService,
      secretsService,
    );
  }
}
