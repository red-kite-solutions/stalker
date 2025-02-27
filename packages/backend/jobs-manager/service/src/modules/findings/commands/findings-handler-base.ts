import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '../../database/admin/config/config.service';
import { CustomJobsService } from '../../database/custom-jobs/custom-jobs.service';
import { JobExecutionsService } from '../../database/jobs/job-executions.service';
import { JobFactory } from '../../database/jobs/jobs.factory';
import { Job } from '../../database/jobs/models/jobs.model';
import { EventSubscriptionsService } from '../../database/subscriptions/event-subscriptions/event-subscriptions.service';
import { SubscriptionsUtils } from '../../database/subscriptions/subscriptions.utils';

import { SecretsService } from '../../database/secrets/secrets.service';
import { SubscriptionTriggersService } from '../../database/subscriptions/subscription-triggers/subscription-triggers.service';
import { JobParameter } from '../../database/subscriptions/subscriptions.type';
import { FindingCommand } from './findings.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor(
    private subscriptionService: EventSubscriptionsService,
    protected jobsService: JobExecutionsService,
    private customJobsService: CustomJobsService,
    private configService: ConfigService,
    private subscriptionTriggersService: SubscriptionTriggersService,
    private secretsService: SecretsService,
  ) {}

  public async execute(command: T) {
    console.log('FHB: ' + command.finding.key);

    // Only the subscriptions concerning the current project and the current finding
    // type are returned by the database
    const subs = await this.subscriptionService.getAllForFinding(
      command.projectId,
      command.finding.key,
    );
    console.log('FHB: Subs: ' + JSON.stringify(subs));

    for (const sub of subs) {
      // Validate that, according to the conditions, the job should be executed.
      // If not, then we go straight for the other subscription
      if (
        !SubscriptionsUtils.shouldExecute(
          sub.isEnabled,
          sub.conditions,
          command,
        )
      ) {
        this.logger.debug(
          `Skipping job publication for ${sub.name}; conditions not met or subscription is disabled.`,
        );
        continue;
      }
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

      // A subscription's discrimator is a dynamic way to differentiate between subscription
      // triggers for a ressource's aspect that cannot be told apart by correlation key alone
      // A good example of that is two website endpoints having the same website correlation key
      if (sub.discriminator) {
        sub.discriminator = SubscriptionsUtils.replaceValueIfReferingToFinding(
          sub.discriminator,
          command.finding,
        );
      }

      // The job parameters will be added to the jobParameters array
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

      // Adding the projectId JobParameter to every job as it is always needed
      const projectIdParameter = new JobParameter();
      projectIdParameter.name = 'projectId';
      projectIdParameter.value = command.projectId;
      sub.jobParameters.push(projectIdParameter);

      // Launching the generic function that creates the appropriate job and publishing it
      const job: Job = await JobFactory.createJob(
        sub.jobName,
        sub.jobParameters,
        this.secretsService,
        command.projectId,
      );
      if (
        job != null &&
        (await this.subscriptionTriggersService.attemptTrigger(
          sub._id.toString(),
          command.finding.correlationKey,
          sub.cooldown,
          sub.discriminator,
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
