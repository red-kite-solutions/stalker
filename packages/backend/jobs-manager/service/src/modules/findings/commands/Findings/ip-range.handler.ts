import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../../database/jobs/job-executions.service';
import { IpRangeService } from '../../../database/reporting/ip-ranges/ip-range.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { UserFindingHandlerBase } from '../user-findings-handler-base';
import { IpRangeCommand } from './ip-range.command';
import { IpCommand } from './ip.command';

@CommandHandler(IpCommand)
export class IpRangeHandler extends UserFindingHandlerBase<IpRangeCommand> {
  protected logger: Logger = new Logger(IpRangeHandler.name);

  constructor(
    private readonly ipRangeService: IpRangeService,
    jobService: JobExecutionsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
  ) {
    super(
      subscriptionsService,
      jobService,
      customJobsService,
      configService,
      subscriptionTriggersService,
      secretsService,
    );
  }

  protected async executeCore(command: IpRangeCommand) {
    if (!command.finding.jobId) return;

    await this.ipRangeService.addIpRange(
      command.finding.ip,
      command.finding.mask,
      command.projectId,
    );
  }
}
