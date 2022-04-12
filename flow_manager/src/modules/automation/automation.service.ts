import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from '../database/jobs/jobs.service';
import { Domain } from '../database/reporting/domain/domain.model';
import { DomainsService } from '../database/reporting/domain/domain.service';
import { CompanyService } from '../database/reporting/company.service';

@Injectable()
export class AutomationService {
  constructor(
    private jobService: JobsService,
    private domainService: DomainsService,
    private companyService: CompanyService,
  ) {}

  // TODO: This time interval will have to be customizable, either via the controller or with the configurations, or both.
  // Maybe an endpoint in the controller that sets this config value as well as the timer itself, or the other way around
  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'daily_report_keybase',
    timeZone: 'America/Toronto',
  })
  public async refreshIpAdresses(): Promise<void> {
    this.domainService.resolveAll();
  }
}
