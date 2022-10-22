import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { Job } from 'src/modules/database/jobs/models/jobs.model';
import { Company } from '../../database/reporting/company.model';
import { CompanyService } from '../../database/reporting/company.service';
import { FindingCommand } from './hostname-ip.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor(
    private jobService: JobsService,
    private companyService: CompanyService,
  ) {}

  public async execute(command: T) {
    const job = await this.jobService.getById(command.jobId);
    if (job == null) {
      this.logger.error(
        `The given job does not exist (jobId=${command.jobId})`,
      );
      return;
    }

    const company = await this.companyService.get(job.companyId);
    if (company == null) {
      this.logger.error(
        `The company for the given job does not exist (jobId=${command.jobId}, companyId=${job.companyId})`,
      );
      return;
    }

    await this.executeCore(job, company, command);
  }

  protected abstract executeCore(
    job: Job,
    company: Company,
    command: T,
  ): Promise<unknown | void>;
}
