import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { JobDefinitions } from '../../database/jobs/job-model.module';
import { JobsService } from '../../database/jobs/jobs.service';
import { Job } from '../../database/jobs/models/jobs.model';
import { JobParameter } from '../../database/subscriptions/subscriptions.model';
import { SubscriptionsService } from '../../database/subscriptions/subscriptions.service';
import { FindingsCommandMapping } from './findings-commands';
import { FindingCommand } from './findings.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor(
    private subscriptionService: SubscriptionsService,
    protected jobsService: JobsService,
  ) {}

  public async execute(command: T) {
    console.log(command.commandType);
    const mapping = FindingsCommandMapping.find(
      (m) => command.commandType === m.command.name,
    );

    console.log(command.companyId);
    console.log(mapping);
    const subs = await this.subscriptionService.getAllForFinding(
      command.companyId,
      mapping.finding,
    );

    console.log(subs);
    const companyIdParameter = new JobParameter();
    companyIdParameter.name = 'companyId';
    companyIdParameter.value = command.companyId;

    for (const sub of subs) {
      const jobDefinition = JobDefinitions.find((j) => j.name === sub.jobName);

      sub.jobParameters.push(companyIdParameter);
      const job: Job = jobDefinition.pointer(sub.jobParameters);
      this.jobsService.publish(job);
    }

    await this.executeCore(command);
  }

  protected abstract executeCore(command: T): Promise<unknown | void>;
}
