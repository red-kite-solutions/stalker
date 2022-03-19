import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService, JobTypes } from '../database/jobs/jobs.service';
import { DomainNameResolvingJob } from '../database/jobs/jobs_factory/domain_name_resolving.job';
import { Domain } from '../database/reporting/domain/domain.model';
import { DomainsService } from '../database/reporting/domain/domain.service';
import { ProgramService } from '../database/reporting/program.service';

@Injectable()
export class AutomationService {
  constructor(
    private jobService: JobsService,
    private domainService: DomainsService,
    private programService: ProgramService,
  ) {}

  // TODO: This time interval will have to be customizable, either via the controller or with the configurations, or both.
  // Maybe an endpoint in the controller that sets this config value as well as the timer itself, or the other way around
  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'daily_report_keybase',
    timeZone: 'America/Toronto',
  })
  public async refreshIpAdresses(): Promise<void> {
    const programs = await this.programService.getAll();
    programs.forEach((p) => {
      this.domainService.runForEach(p.name, (d: Domain, parents: string) => {
        const job: DomainNameResolvingJob = this.jobService.manufactureJob(
          JobTypes.DOMAIN_NAME_RESOLVING,
          p.name,
        ) as DomainNameResolvingJob;
        if (parents) {
          job.typedData.domain_name = `${d.name}.${parents}`;
        } else {
          job.typedData.domain_name = `${d.name}`;
        }

        job.publish();
      });
    }, this);
  }
}
