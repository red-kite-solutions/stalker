import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { CompanyService } from '../../../database/reporting/company.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { IpCommand } from './ip.command';
import { IpRangeCommand } from './ipRange.command';

@CommandHandler(IpCommand)
export class IpRangeHandler extends UserFindingHandlerBase<IpRangeCommand> {
  protected logger: Logger = new Logger('IpRangeHandler');

  constructor(
    private readonly companyService: CompanyService,
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

  protected async executeCore(command: IpRangeCommand) {
    if (!command.finding.jobId) return;

    await this.companyService.addIpRangeWithMask(
      command.companyId,
      command.finding.ip,
      command.finding.mask,
    );
  }
}
