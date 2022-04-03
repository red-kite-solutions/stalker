import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DomainTreeUtils from '../../../../utils/domain_tree.utils';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService } from '../../jobs/jobs.service';
import { Program } from '../program.model';
import { ProgramService } from '../program.service';
import { ReportService } from '../report/report.service';
import { SubmitSubdomainDto, SubmitSubdomainManuallyDto } from './domain.dto';
import { Domain } from './domain.model';

@Injectable()
export class DomainsService {
  constructor(
    @InjectModel('domain') private readonly domainModel: Model<Domain>,
    private jobService: JobsService,
    private programService: ProgramService,
    private reportService: ReportService,
    private configService: ConfigService,
  ) {}

  private async addDomainsFromProgram(
    subdomains: string[],
    programName: string,
  ) {
    const program = await this.programService.get(programName);

    if (!program) {
      throw new HttpException(
        'The program associated with the given job does not exist.',
        400,
      );
    }

    const newDomains: string[] = [];
    subdomains.forEach((domainName) => {
      newDomains.push(...DomainTreeUtils.growDomainTree(program, domainName));
    });

    const config = await this.configService.getConfig();

    if (config?.isNewContentReported) {
      this.reportService.addNewDomains(programName, subdomains);
    }

    // For each new domain name found, create a domain name resolution job for the domain
    newDomains.forEach((domain) => {
      const job = this.jobService.createDomainResolvingJob(
        program.name,
        domain,
      );
      this.jobService.publish(job);
    });

    await this.programService.update(programName, program);
  }

  public async addDomains(dto: SubmitSubdomainDto, jobId: string) {
    // Find the proper program using the jobId and then the program name
    const job = await this.jobService.getById(jobId);

    if (!job) {
      throw new HttpException('The job id is invalid.', 400);
    }

    await this.addDomainsFromProgram(dto.subdomains, job.program);
    await this.jobService.delete(jobId);
  }

  public async addDomainsManually(dto: SubmitSubdomainManuallyDto) {
    await this.addDomainsFromProgram(dto.subdomains, dto.program);
  }

  /**
   * ## THIS FUNCTION MAY NOT BE PROPERLY TESTED
   * ### You can use it, but may have to debug it
   * Runs the function callback for each leaf of a program's domain trees.
   * Usefull to act on data that we already have accross a program.
   * The changes done to the domains in the callback will be applied and saved in the db before return
   * @param program The name of the program
   * @param callback The function to run
   */

  public async runForEachAndUpdate(
    program: string,
    callback: () => unknown,
  ): Promise<void> {
    let i = 0;
    let p: Program = await this.programService.getWithDomainAtIndex(program, i);
    let d: Domain;
    if (p && p.domains) {
      d = p.domains[0];
    }
    while (d) {
      DomainTreeUtils.doForEveryLeaf(d, callback);
      const search = { name: program, 'domains.name': d.name };
      const filterData = [{ $set: { 'domains.$': d } }];
      this.domainModel.updateOne(search, filterData);
      i++;
      p = await this.programService.getWithDomainAtIndex(program, i);
      if (p && p.domains) {
        d = p.domains[0];
      } else {
        d = null;
      }
    }
  }

  /**
   * Runs the function callback for each leaf of a program's domain trees.
   * Usefull to act on data that we already have accross a program, like creating new jobs that updates current data.
   * @param program The name of the program
   * @param callback The function to execute. It accepts a domain object and the parent's string as a parameter
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public async runForEach(program: string, callback: Function): Promise<void> {
    let i = 0;
    let p = await this.programService.getWithDomainAtIndex(program, i);
    let d: Domain = null;
    if (p && p.domains) {
      d = p.domains[0];
    }
    while (d) {
      DomainTreeUtils.doForEveryLeaf(d, callback);
      i++;
      p = await this.programService.getWithDomainAtIndex(program, i);
      if (p && p.domains) {
        d = p.domains[0];
      } else {
        d = null;
      }
    }
  }
}
