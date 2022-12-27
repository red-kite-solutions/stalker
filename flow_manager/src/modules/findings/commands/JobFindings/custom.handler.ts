import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { JobsService } from '../../../database/jobs/jobs.service';
import { SubscriptionsService } from '../../../database/subscriptions/subscriptions.service';
import { FindingsService } from '../../findings.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { CustomFindingCommand } from './custom.command';

@CommandHandler(CustomFindingCommand)
export class CustomFindingHandler extends JobFindingHandlerBase<CustomFindingCommand> {
  protected logger: Logger = new Logger('CustomFindingHandler');

  constructor(
    private findingsService: FindingsService,
    jobService: JobsService,
    subscriptionsService: SubscriptionsService,
  ) {
    super(jobService, subscriptionsService);
  }

  protected async executeCore(command: CustomFindingCommand) {
    console.log(command);

    this.findingsService.save(
      command.companyId,
      command.finding,
      command.jobId,
    );
  }
}
