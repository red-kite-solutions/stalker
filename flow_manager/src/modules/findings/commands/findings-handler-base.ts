import { ICommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { Job } from 'src/modules/database/jobs/models/jobs.model';
import { FindingCommand } from './hostname-ip.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  constructor(private jobService: JobsService) {
    console.log(jobService);
  }

  public async execute(command: T) {
    const job = await this.jobService.getById(command.jobId);
    await this.executeCore(job, command);
  }

  protected abstract executeCore(job: Job, command: T): Promise<unknown | void>;
}
