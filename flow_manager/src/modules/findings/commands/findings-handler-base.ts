import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../database/admin/config/config.service';
import { CustomJobsService } from '../../database/custom-jobs/custom-jobs.service';
import { JobFactory } from '../../database/jobs/jobs.factory';
import { JobsService } from '../../database/jobs/jobs.service';
import { CustomJob } from '../../database/jobs/models/custom-job.model';
import { Job } from '../../database/jobs/models/jobs.model';
import { JobParameter } from '../../database/subscriptions/event-subscriptions/event-subscriptions.model';
import { EventSubscriptionsService } from '../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionsUtils } from '../../database/subscriptions/subscriptions.utils';

import { SubscriptionTriggersService } from '../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { FindingCommand } from './findings.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor(
    private subscriptionService: EventSubscriptionsService,
    protected jobsService: JobsService,
    private customJobsService: CustomJobsService,
    private configService: ConfigService,
    private subscriptionTriggersService: SubscriptionTriggersService,
  ) {}

  public async execute(command: T) {
    // Only the subscriptions concerning the current company and the current finding
    // type are returned by the database
    const subs = await this.subscriptionService.getAllForFinding(
      command.companyId,
      command.finding.key,
    );

    for (const sub of subs) {
      // Validate that, according to the conditions, the job should be executed.
      // If not, then we go straight for the other subscription
      if (!SubscriptionsUtils.shouldExecute(sub.conditions, command)) continue;

      // This loop ensures that all parameters refering to a finding's output
      // (ex: ${ip} for refering to an ip parameter of a finding) is replaced with the
      // proper value. The check for the variable name is case insensitive.
      for (const param of sub.jobParameters) {
        param.value =
          SubscriptionsUtils.replaceValueIfReferingToFinding<unknown>(
            param.value,
            command.finding,
          );
      }

      if (sub.jobName === CustomJob.name) {
        // Adding the parameters specific to a CustomJob.
        // The jobParameters array will be customized for the CustomJob
        // All the subscription's parameters are actually customJobParameters
        // and the actual parameters come from the CustomJobEntry in the database
        // If an error occures, undefined is returned.
        sub.jobParameters =
          await SubscriptionsUtils.getParametersForCustomJobSubscription(
            sub,
            this.logger,
            this.customJobsService,
            this.configService,
          );

        if (!sub.jobParameters) continue;
      }

      // Adding the companyId JobParameter to every job as it is always needed
      const companyIdParameter = new JobParameter();
      companyIdParameter.name = 'companyId';
      companyIdParameter.value = command.companyId;
      sub.jobParameters.push(companyIdParameter);

      // Launching the generic function that creates the appropriate job and publishing it
      const job: Job = JobFactory.createJob(sub.jobName, sub.jobParameters);

      if (
        job != null &&
        (await this.subscriptionTriggersService.attemptTrigger(
          sub._id.toString(),
          command.finding.correlationKey,
          sub.cooldown,
        ))
      )
        this.jobsService.publish(job);
    }

    try {
      await this.executeCore(command);
    } catch (e) {
      this.logger.error('An error occurred while executing the handler.', e);
    }
  }

  protected abstract executeCore(command: T): Promise<unknown | void>;
}
