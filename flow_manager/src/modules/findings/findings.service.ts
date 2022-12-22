import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { HttpBadRequestException } from '../../exceptions/http.exceptions';
import { Page } from '../../types/page.type';
import { JobsService } from '../database/jobs/jobs.service';
import { CompanyService } from '../database/reporting/company.service';
import { Finding } from '../database/reporting/findings/finding.model';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { PortCommand } from './commands/JobFindings/port.command';

export type NewFinding = HostnameIpFinding | HostnameFinding | PortFinding;

export class PortFinding {
  type: 'PortFinding';
  protocol: 'tcp' | 'udp';
  ip: string;
  port: number;
}

export class HostnameFinding {
  type: 'HostnameFinding';
  domainName: string;
  companyId: string;
}

export class HostnameIpFinding {
  type: 'HostnameIpFinding';
  domainName: string;
  ip: string;
}

export interface NewFindings {
  findings: NewFinding[];
}

export interface JobFindings extends NewFindings {
  jobId: string;
}

@Injectable()
export class FindingsService {
  private logger = new Logger(FindingsService.name);

  constructor(
    private commandBus: CommandBus,
    private jobsService: JobsService,
    private companyService: CompanyService,
    @InjectModel('finding')
    private readonly findingModel: Model<Finding>,
  ) {}

  public async getAll(
    target: string,
    page: number,
    pageSize: number,
  ): Promise<Page<Finding>> {
    if (page < 1) throw new HttpBadRequestException('Page starts at 1.');

    const filters: FilterQuery<Finding> = {
      correlationKey: {
        $eq: target,
      },
    };
    const items = await this.findingModel
      .find(filters)
      .sort({
        created: 'desc',
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    const totalRecords = await this.findingModel.countDocuments(filters);

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Handles findings that WERE found by a job
   * @param findings
   */
  public handleJobFindings(findings: JobFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, findings.jobId);
    }
  }

  /**
   * Handles findings that were NOT found by a job
   * @param findings
   */
  public handleFindings(findings: NewFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding);
    }
  }

  private async handleFinding(finding: NewFinding, jobId: string = '') {
    let companyId = '';
    if (jobId) {
      const job = await this.jobsService.getById(jobId);
      if (job === null) {
        this.logger.error(`The given job does not exist (jobId=${jobId})`);
        return;
      }

      const company = await this.companyService.get(job.companyId);
      if (company === null) {
        this.logger.error(
          `The company for the given job does not exist (jobId=${jobId}, companyId=${job.companyId})`,
        );
        return;
      }
      companyId = company._id.toString();
    }

    switch (finding.type) {
      case 'HostnameIpFinding':
        this.commandBus.execute(
          new HostnameIpCommand(
            jobId,
            companyId,
            HostnameIpCommand.name,
            finding,
          ),
        );
        break;
      case 'HostnameFinding':
        this.commandBus.execute(
          new HostnameCommand(finding.companyId, HostnameCommand.name, finding),
        );
        break;

      case 'PortFinding':
        this.commandBus.execute(
          new PortCommand(jobId, companyId, PortCommand.name, finding),
        );
        break;

      default:
        console.log('Unknown finding type');
    }
  }
}
