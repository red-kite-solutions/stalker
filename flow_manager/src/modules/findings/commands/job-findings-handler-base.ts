import { ICommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../database/jobs/jobs.service';
import { SubscriptionsService } from '../../database/subscriptions/subscriptions.service';
import { FindingHandlerBase } from './findings-handler-base';
import { JobFindingCommand } from './findings.command';

export abstract class JobFindingHandlerBase<T extends JobFindingCommand>
  extends FindingHandlerBase<T>
  implements ICommandHandler<T>
{
  constructor(
    jobService: JobsService,
    subscriptionService: SubscriptionsService,
  ) {
    super(subscriptionService, jobService);
  }
}
