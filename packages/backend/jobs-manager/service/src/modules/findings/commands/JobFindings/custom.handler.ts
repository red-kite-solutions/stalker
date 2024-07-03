import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';

import { ConfigService } from '../../../database/admin/config/config.service';
import { CustomJobsService } from '../../../database/custom-jobs/custom-jobs.service';
import { JobsService } from '../../../database/jobs/jobs.service';
import { PortService } from '../../../database/reporting/port/port.service';
import { WebsiteService } from '../../../database/reporting/websites/website.service';
import { SecretsService } from '../../../database/secrets/secrets.service';
import { EventSubscriptionsService } from '../../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionTriggersService } from '../../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { FindingsService } from '../../findings.service';
import { JobFindingHandlerBase } from '../job-findings-handler-base';
import { CustomFindingCommand } from './custom.command';

@CommandHandler(CustomFindingCommand)
export class CustomFindingHandler extends JobFindingHandlerBase<CustomFindingCommand> {
  protected logger: Logger = new Logger('CustomFindingHandler');

  constructor(
    private findingsService: FindingsService,
    jobService: JobsService,
    subscriptionsService: EventSubscriptionsService,
    customJobsService: CustomJobsService,
    configService: ConfigService,
    subscriptionTriggersService: SubscriptionTriggersService,
    secretsService: SecretsService,
    private portService: PortService,
    private websiteService: WebsiteService,
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

  private async handlePortServiceFinding(command: CustomFindingCommand) {
    try {
      let service: string = undefined;
      for (const f of command.finding.fields) {
        if (f.key === 'serviceName') service = f.data;
      }

      if (service === 'http' || service === 'https') {
        // If we find an http or https service, we will build a more complex website resource
        await this.websiteService.emitWebsiteFindingsForAllHostDomains(
          command.jobId,
          command.projectId,
          command.finding.ip,
          command.finding.port,
          '/',
          service === 'https',
        );
      }

      this.portService.addPortByIp(
        command.finding.ip,
        command.projectId,
        command.finding.port,
        command.finding.protocol,
        service.trim(),
      );
    } catch (err) {
      this.logger.error("Error happened while adding a port's service");
      this.logger.error(err);
    }
  }

  private async handleWebsitePathFinding(command: CustomFindingCommand) {
    try {
      for (const f of command.finding.fields) {
        if (f.key === 'endpoint' && f.data) {
          await this.websiteService.addPathToWebsite(
            f.data,
            command.projectId,
            command.finding.ip,
            command.finding.port,
            command.finding.domainName,
            command.finding.path,
          );
        }
      }
    } catch (err) {
      this.logger.error("Error happened while adding a website's endpoint");
      this.logger.error(err);
    }
  }

  protected async executeCore(command: CustomFindingCommand) {
    switch (command.finding.key) {
      case 'PortServiceFinding':
        await this.handlePortServiceFinding(command);
        break;
      case 'WebsitePathFinding':
        await this.handleWebsitePathFinding(command);
        break;
      default:
        break;
    }

    this.findingsService.save(
      command.projectId,
      command.jobId,
      command.finding,
    );
  }
}
