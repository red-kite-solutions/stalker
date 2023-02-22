import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../exceptions/http.exceptions';
import { Page } from '../../types/page.type';
import { CompanyUnassigned } from '../../validators/isCompanyId.validator';
import { JobsService } from '../database/jobs/jobs.service';
import { CompanyService } from '../database/reporting/company.service';
import { CorrelationKeyUtils } from '../database/reporting/correlation.utils';
import { CustomFinding } from '../database/reporting/findings/finding.model';
import { HostnameCommand } from './commands/Findings/hostname.command';
import { CustomFindingCommand } from './commands/JobFindings/custom.command';
import { HostnameIpCommand } from './commands/JobFindings/hostname-ip.command';
import { PortCommand } from './commands/JobFindings/port.command';
import { CustomFindingFieldDto } from './finding.dto';

export type Finding =
  | HostnameIpFinding
  | HostnameFinding
  | PortFinding
  | JobStatusFinding
  | CreateCustomFinding;

export class FindingBase {
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

    const filters: FilterQuery<CustomFinding> = {
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

    const correlationKey = this.getCorrelationKey(
      companyId,
      dto.domainName,
      dto.ip,
      dto.port,
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

  private getCorrelationKey(
    companyId: string,
    domainName?: string,
    ip?: string,
    port?: number,
  ) {
    if (!companyId) {
      throw new HttpBadRequestException(
        'CompanyId is required in order to create a custom finding.',
      );
    }

    let correlationKey = null;
    if (domainName) {
      if (ip || port)
        throw new HttpBadRequestException(
          'Ambiguous request; must provide a domainName, an ip or a pair of ip and port.',
        );

      correlationKey = CorrelationKeyUtils.domainCorrelationKey(
        companyId,
        domainName,
      );
    } else if (ip) {
      if (port) {
        correlationKey = CorrelationKeyUtils.portCorrelationKey(
          companyId,
          ip,
          port,
        );
      } else
        correlationKey = CorrelationKeyUtils.hostCorrelationKey(companyId, ip);
    } else if (port) {
      throw new HttpBadRequestException(
        'The ip must be specified with the port.',
      );
    } else {
      throw new HttpBadRequestException(
        'Correlation key must contain at least a domain or a host.',
      );
    }

    return correlationKey;
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
        this.jobsService.addJobOutputLine(
          jobId,
          timestamp,
          JSON.stringify(finding),
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

      case 'CustomFinding':
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
        console.log(`Unknown finding type ${finding['type']}`);
    }
  }
}
