import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { HostService } from '../../../database/reporting/host/host.service';
import { PortService } from '../../../database/reporting/port/port.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { PortCommand } from './port.command';

@CommandHandler(PortCommand)
export class PortHandler extends JobFindingHandlerBase<PortCommand> {
  protected logger: Logger = new Logger('PortHandler');

  constructor(
    private hostService: HostService,
    private portService: PortService,
    jobService: JobsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
  ) {
    super(
      jobService,
      subscriptionsService,
      customJobsService,
      configService,
      subscriptionTriggersService,
      secretsService,
    );
  }

  protected async executeCore(command: PortCommand) {
    const protocol = command.finding.fields.find(
      (x) => x?.key === 'protocol',
    )?.data;

    await this.portService.addPortByIp(
      command.finding.ip,
      command.projectId,
      command.finding.port,
      protocol,
    );
  }
}
