import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DomainTreeUtils from '../../../../utils/domain_tree.utils';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { Domain } from '../domain/domain.model';
import { ProgramService } from '../program.service';
import { ReportService } from '../report/report.service';
import { SubmitHostDto } from './host.dto';
import { Host } from './host.model';

@Injectable()
export class HostService {
  private logger = new Logger(HostService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private jobService: JobsService,
    private programService: ProgramService,
    private reportService: ReportService,
    private configService: ConfigService,
  ) {}

  public async addHostsToDomain(dto: SubmitHostDto, jobId: string) {
    // Find the proper program using the jobId and then the program name
    const job = await this.jobService.getById(jobId);

    if (!job) {
      this.logger.debug(`Could not find the job ${jobId}`);
      throw new HttpException('The job id is invalid.', 400);
    }
    const program = await this.programService.get(job.program);

    if (!program) {
      this.logger.debug(`Could not find the program ${job.program}`);
      throw new HttpException(
        'The program associated with the given job does not exist.',
        400,
      );
    }

    const domain: Domain = DomainTreeUtils.findDomainObject(
      program,
      dto.domainName,
    );

    if (!domain) {
      throw new HttpException(
        'The given subdomain is not part of the given program. Maybe it needs to be added.',
        500,
      );
    }
    let newIps: string[] = [];

    if (!domain.hosts) {
      domain.hosts = [];
      newIps = dto.ips;
      dto.ips.forEach((ip) => {
        const newHost = new Host();
        newHost.ip = ip;
        domain.hosts.push(newHost);
      });
    } else {
      dto.ips.forEach((ip) => {
        if (!domain.hosts.some((host) => host.ip === ip)) {
          const newHost = new Host();
          newHost.ip = ip;
          domain.hosts.push(newHost);
          newIps.push(ip);
        }
      });
    }
    const config = await this.configService.getConfig();

    if (config.isNewContentReported) {
      this.reportService.addNewHosts(program.name, dto.domainName, dto.ips);
    }

    await this.programService.update(job.program, program);
    await this.jobService.delete(jobId);
  }
}
