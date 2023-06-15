import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../database/admin/config/config.service';
import { CustomJobsService } from '../../database/custom-jobs/custom-jobs.service';
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
    customJobsService: CustomJobsService,
    configService: ConfigService,
  ) {
    super(subscriptionService, jobService, customJobsService, configService);
  }
}
