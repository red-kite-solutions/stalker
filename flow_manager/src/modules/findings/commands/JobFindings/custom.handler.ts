import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
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
    customJobsService: CustomJobsService,
    configService: ConfigService,
  ) {
    super(jobService, subscriptionsService, customJobsService, configService);
  }

  protected async executeCore(command: CustomFindingCommand) {
    this.findingsService.save(
      command.companyId,
      command.jobId,
      command.finding,
    );
  }
}
