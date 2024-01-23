import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../exceptions/http.exceptions';
import { Page } from '../../types/page.type';
import { CompanyUnassigned } from '../../validators/is-company-id.validator';
import { JobsService } from '../database/jobs/jobs.service';
import { CompanyService } from '../database/reporting/company.service';
import { CorrelationKeyUtils } from '../database/reporting/correlation.utils';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { IpCommand } from './commands/Findings/ip.command';
import { IpRangeCommand } from './commands/Findings/ipRange.command';
import { CustomFindingCommand } from './commands/JobFindings/custom.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { PortCommand } from './commands/JobFindings/port.command';
import { CustomFindingFieldDto } from './finding.dto';

export type Finding =
  | HostnameIpFinding
  | HostnameFinding
  | IpFinding
  | IpRangeFinding
  | PortFinding
  | JobStatusFinding
  | CreateCustomFinding;

export class FindingBase {
  jobId?: string;
  correlationKey?: string;
  fields?: CustomFindingFieldDto[];
}

export class PortFinding extends FindingBase {
  type: 'PortFinding';
  key: 'PortFinding';
  ip: string;
  port: number;
  fields: [
    {
      type: 'text';
      key: 'protocol';
      data: 'tcp' | 'udp';
      label: string;
    },
  ];
}

export class CreateCustomFinding extends FindingBase {
  type: 'CustomFinding';
  key: string;
  domainName?: string;
  ip?: string;
  port?: number;
  protocol?: string;
  name: string;
}

export class JobStatusFinding extends FindingBase {
  type: 'JobStatusFinding';
  key: 'JobStatusFinding';
  status: string;
}

export class HostnameFinding extends FindingBase {
  type: 'HostnameFinding';
  key: 'HostnameFinding';
  companyId: string;
  domainName: string;
}

export class IpFinding extends FindingBase {
  type: 'IpFinding';
  key: 'IpFinding';
  companyId: string;
  ip: string;
}

export class IpRangeFinding extends FindingBase {
  type: 'IpRangeFinding';
  key: 'IpRangeFinding';
  companyId: string;
  ip: string;
  mask: number; // ex: 24
}

export class HostnameIpFinding extends FindingBase {
  type: 'HostnameIpFinding';
  key: 'HostnameIpFinding';
  domainName: string;
  ip: string;
}

export interface Findings {
  findings: Finding[];
}

export interface JobFindings extends Findings {
  jobId: string;
  timestamp: number;
}

@Injectable()
export class FindingsService {
  private logger = new Logger(FindingsService.name);

  constructor(
    private commandBus: CommandBus,
    private jobsService: JobsService,
    private companyService: CompanyService,
    @InjectModel('finding')
    private readonly findingModel: Model<CustomFinding>,
  ) {}

  public async getAll(
    target: string,
    page: number,
    pageSize: number,
  ): Promise<Page<CustomFinding>> {
    if (page < 1) throw new HttpBadRequestException('Page starts at 1.');

    const filters: FilterQuery<CustomFinding> = {};

    if (target) {
      filters.correlationKey = {
        $eq: target,
      };
    }

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
   * Saves the given finding.
   */
  public async save(
    companyId: string,
    jobId: string = null,
    dto: CreateCustomFinding,
  ) {
    if (companyId !== undefined) {
      const company = await this.companyService.get(companyId);
      if (company === null) {
        throw new HttpNotFoundException(
          `The company for the given job does not exist (jobId=${jobId}, companyId=${companyId})`,
        );
      }
    } else {
      companyId = CompanyUnassigned;
    }

    const job = await this.jobsService.getById(jobId);
    if (job === null) {
      throw new HttpNotFoundException(
        `The given job does not exist (jobId=${jobId})`,
      );
    }

    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      dto.domainName,
      dto.ip,
      dto.port,
      dto.protocol,
    );

    const finding: CustomFinding = {
      correlationKey,
      jobId,
      created: new Date(),
      fields: dto.fields,
      name: dto.name,
      key: dto.key,
    };

    await this.findingModel.create(finding);
  }

  /**
   * Handles findings that WERE found by a job
   * @param findings
   */
  public handleJobFindings(findings: JobFindings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, findings.timestamp, findings.jobId).catch(
        (e) => this.logger.error(e),
      );
    }
  }

  /**
   * Handles findings that were NOT found by a job
   * This function generates its own finding timestamp as the finding was created by
   * the flow manager anyway
   * @param findings
   */
  public handleFindings(findings: Findings) {
    for (const finding of findings.findings) {
      this.handleFinding(finding, Date.now());
    }
  }

  private async handleFinding(
    finding: Finding,
    timestamp: number,
    jobId: string = '',
  ) {
    let companyId = '';
    if (jobId) {
      const job = await this.jobsService.getById(jobId);
      if (job === null) {
        this.logger.error(`The given job does not exist (jobId=${jobId})`);
        return;
      }
      finding.jobId = jobId;

      if (job.companyId !== undefined) {
        const company = await this.companyService.get(job.companyId);
        if (company === null) {
          this.logger.error(
            `The company for the given job does not exist (jobId=${jobId}, companyId=${job.companyId})`,
          );
          return;
        }
        companyId = company._id.toString();
      } else {
        companyId = CompanyUnassigned;
      }
      if (finding.type !== 'JobStatusFinding') {
        await this.jobsService.addJobOutputLine(
          jobId,
          timestamp,
          JSON.stringify(finding),
          'info',
        );
      } else {
        // If it was only a status update, no need to do the whole findings' logic
        this.jobsService.updateJobStatus(jobId, finding.status, timestamp);
        return;
      }
    }

    if (companyId === CompanyUnassigned) {
      // Skipping the findings management if it was not assigned to any company,
      // as the job was run as a one time thing. The output will be fetched by
      // the front-end and will be shown to the user.
      return;
    }

    switch (finding.type) {
      case 'HostnameIpFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          companyId,
          null,
          finding.ip,
        );
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
        finding.companyId = finding.companyId ? finding.companyId : companyId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.companyId,
          finding.domainName,
        );
        this.commandBus.execute(
          new HostnameCommand(finding.companyId, HostnameCommand.name, finding),
        );
        break;

      case 'IpFinding':
        finding.companyId = finding.companyId ? finding.companyId : companyId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.companyId,
          null,
          finding.ip,
        );
        this.commandBus.execute(
          new IpCommand(finding.companyId, IpCommand.name, finding),
        );
        break;

      case 'IpRangeFinding':
        finding.companyId = finding.companyId ? finding.companyId : companyId;
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          finding.companyId,
          null,
          finding.ip,
          null,
          null,
          finding.mask,
        );
        this.commandBus.execute(
          new IpRangeCommand(finding.companyId, IpRangeCommand.name, finding),
        );
        break;

      case 'PortFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          companyId,
          null,
          finding.ip,
          finding.port,
          finding.fields[0]?.data,
        );
        this.commandBus.execute(
          new PortCommand(jobId, companyId, PortCommand.name, finding),
        );
        break;

      case 'CustomFinding':
        finding.correlationKey = CorrelationKeyUtils.generateCorrelationKey(
          companyId,
          finding.domainName,
          finding.ip,
          finding.port,
          finding.protocol,
        );
        this.commandBus.execute(
          new CustomFindingCommand(
            jobId,
            companyId,
            CustomFindingCommand.name,
            finding,
          ),
        );
        break;

      default:
        this.logger.error(`Unknown finding type ${finding['type']}`);
    }
  }
}
