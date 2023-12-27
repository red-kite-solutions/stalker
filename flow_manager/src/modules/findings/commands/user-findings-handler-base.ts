import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../database/admin/config/config.service';
import { CustomJobsService } from '../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../database/jobs/jobs.service';
import { EventSubscriptionsService } from '../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { FindingHandlerBase } from './findings-handler-base';
import { FindingCommand } from './findings.command';

export abstract class UserFindingHandlerBase<T extends FindingCommand>
  extends FindingHandlerBase<T>
  implements ICommandHandler<T>
{
  constructor(
    subscriptionService: EventSubscriptionsService,
    jobsService: JobsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
  ) {
    super(
      subscriptionService,
      jobsService,
      customJobsService,
      configService,
      subscriptionTriggersService,
    );
  }
}
