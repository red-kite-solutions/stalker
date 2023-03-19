import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { writeFileSync } from 'fs';
import { UpdateResult } from 'mongodb';
import { Model, UpdateWriteOpResult } from 'mongoose';
import Mustache from 'mustache';
import { KeybaseService } from '../../../alerts/keybase/keybase.service';
import { ReportEntryDto } from './report.dto';
import { DomainReport, HostReport, Report } from './report.model';
import { reportTemplate } from './report.template.md';

@Injectable()
export class ReportService {
  private REPORT_SUFFIX = '_stalker_report.md';

  constructor(
    @InjectModel('report') private readonly reportModel: Model<Report>,
    private keybaseService: KeybaseService,
  ) {}

  /**
   * Gives the name of the current report, which is today's report. It is likely not fully completed.
   * @returns Date string in format "YYYY-MM-DD_stalker_report.md"
   * */
  public getCurrentReportName(): string {
    return this.getCurrentReportPrefix() + this.REPORT_SUFFIX;
  }

  /**
   * Gives the prefix to the name of the last fully completed report, which is the report from yesterday
   * @returns Date string in format "YYYY-MM-DD"
   * */
  private getCurrentReportPrefix(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Gives the name of the last fully completed report, which is the report from yesterday
   * @returns Date string in format "YYYY-MM-DD_stalker_report.md"
   * */
  public getLastReportName(): string {
    return this.getLastReportPrefix() + this.REPORT_SUFFIX;
  }

  /**
   * Gives the prefix to the name of the last fully completed report, which is the report from yesterday
   * @returns Date string in format "YYYY-MM-DD"
   * */
  private getLastReportPrefix(): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  }

  private getNextReportPrefix(): string {
    const today = new Date();
    const tommorow = new Date(today);
    tommorow.setDate(tommorow.getDate() + 1);
    return tommorow.toISOString().slice(0, 10);
  }

  public async addComment(dto: ReportEntryDto): Promise<UpdateWriteOpResult> {
    const date = this.getCurrentReportPrefix();
    return await this.reportModel
      .updateOne(
        { date: { $eq: date } },
        { $push: { comments: dto.comment } },
        { upsert: true },
      )
      .exec();
  }

  /** Adds new domains and subdomains to the daily report
   * @param companyId The name of the comapny to which the domains and subdomains belong
   * @param domains A string array of the new domains and subdomains, like ["example.com", "sub1.example.com", "sub2.example.com", "sub3.sub1.example.com"]
   */
  public async addDomains(
    companyName: string,
    domains: string[],
  ): Promise<UpdateWriteOpResult> {
    const date = this.getCurrentReportPrefix();
    let domainReports: DomainReport[] = [];
    domains.forEach((domain) => {
      let d = new DomainReport();
      d.companyName = companyName;
      d.name = domain;
      domainReports.push(d);
    });

    return await this.reportModel
      .updateOne(
        { date: { $eq: date } },
        { $push: { domains: { $each: domainReports } } },
        { upsert: true },
      )
      .exec();
  }

  public async addHosts(
    companyName: string,
    ips: string[],
    domain: string = '',
  ): Promise<UpdateResult> {
    const date = this.getCurrentReportPrefix();
    let hostReports: HostReport[] = [];
    ips.forEach((ip) => {
      let h = new HostReport();
      h.companyName = companyName;
      h.ip = ip;
      hostReports.push(h);
    });

    if (domain) {
      await this.reportModel
        .updateOne(
          { date: { $eq: date }, 'domains.name': { $eq: domain } },
          { $push: { 'domains.$[domain].ips': { $each: ips } } },
          { arrayFilters: [{ 'domain.name': domain }], upsert: true },
        )
        .exec();
    }

    return await this.reportModel
      .updateOne(
        { date: { $eq: date } },
        { $push: { hosts: { $each: hostReports } } },
        { upsert: true },
      )
      .exec();
  }

  public async getCurrentReport(): Promise<Report> {
    const date = this.getCurrentReportPrefix();
    let currentReport = await this.getByDate(date);
    if (!currentReport) {
      currentReport = await new this.reportModel({ date: date }).save();
    }
    return currentReport;
  }

  // TODO: remove the automation of reports into an external service for
  // horizontal scalability
  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    name: 'daily_report_keybase',
    timeZone: 'America/Toronto',
  })
  public async initializeNextReport(): Promise<void> {
    await new this.reportModel({ date: this.getNextReportPrefix() }).save();
  }

  /** Creates the report file saved on the disk to be sent by alerting services like the KeybaseService */
  private async createReportFile(report: Report, date = ''): Promise<string> {
    let reportName: string;
    if (date) {
      reportName = '/tmp/' + date + this.REPORT_SUFFIX;
    } else {
      reportName = '/tmp/' + this.getLastReportName();
      date = this.getLastReportPrefix();
    }

    let view = {
      date: report.date,
      comments: report.comments,
      companies: [],
    };

    report.hosts.forEach((host: HostReport) => {
      let index = view.companies.findIndex(
        (company) => company.name === host.companyName,
      );
      if (index === -1) {
        view.companies.push({ name: host.companyName, domains: [], hosts: [] });
        index = view.companies.length - 1;
      }
      view.companies[index].hosts.push(host);
    });

    report.domains.forEach((domain: DomainReport) => {
      let index = view.companies.findIndex(
        (company) => company.name === domain.companyName,
      );
      if (index === -1) {
        view.companies.push({
          name: domain.companyName,
          domains: [],
          hosts: [],
        });
        index = view.companies.length - 1;
      }
      view.companies[index].domains.push(domain);
    });

    const render = Mustache.render(reportTemplate, view);

    writeFileSync(reportName, render);

    return reportName;
  }

  // https://docs.nestjs.com/techniques/task-scheduling
  // Use the keybase service
  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'daily_report_keybase',
    timeZone: 'America/Toronto',
  })
  public async sendDailyReport() {
    const date = this.getLastReportPrefix();
    this.sendReport(date);
  }

  public async sendReport(date: string): Promise<void> {
    const lastReport = await this.getByDate(date);

    if (!lastReport) {
      this.keybaseService.sendSimpleAlertMessage(
        'No report for yesterday was found! Take a day off, apparently I did.',
      );
      return;
    }

    if (!lastReport.comments && !lastReport.domains && !lastReport.hosts) {
      this.keybaseService.sendSimpleAlertMessage(
        'Good news, everyone! There is nothing to report. Have a nice day.',
      );
      return;
    }

    const reportName = await this.createReportFile(lastReport, date);

    this.keybaseService.sendReportFile(reportName);
  }

  private async getByDate(date: string): Promise<Report> {
    return await this.reportModel.findOne({ date: { $eq: date } });
  }
}
