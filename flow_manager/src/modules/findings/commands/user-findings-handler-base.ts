import { ICommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../database/jobs/jobs.service';
import { SubscriptionsService } from '../../database/subscriptions/subscriptions.service';
import { FindingHandlerBase } from './findings-handler-base';
import { FindingCommand } from './findings.command';

export abstract class UserFindingHandlerBase<T extends FindingCommand>
  extends FindingHandlerBase<T>
  implements ICommandHandler<T>
{
  constructor(
    subscriptionService: SubscriptionsService,
    jobsService: JobsService,
  ) {
    super(subscriptionService, jobsService);
  }
}
