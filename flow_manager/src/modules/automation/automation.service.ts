import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from '../database/jobs/jobs.service';
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
        const domainName = parents ? `${d.name}.${parents}` : d.name;
        const job = this.jobService.createDomainResolvingJob(
          p.name,
          domainName,
        );
        this.jobService.publish(job);
      });
    }, this);
  }
}
