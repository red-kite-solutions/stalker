import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DomainTreeUtils from '../../../../utils/domain_tree.utils';
import { ConfigService } from '../../admin/config/config.service';
import { JobsService, JobTypes } from '../../jobs/jobs.service';
import { DomainNameResolvingJob } from '../../jobs/jobs_factory/domain_name_resolving.job';
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

    if (this.configService.config.IsNewContentReported) {
      this.reportService.addNewDomains(programName, subdomains);
    }

    // For each new domain name found, create a domain name resolution job for the domain
    newDomains.forEach((domain) => {
      const manuJob: DomainNameResolvingJob = this.jobService.manufactureJob(
        JobTypes.DOMAIN_NAME_RESOLVING,
        programName,
      ) as DomainNameResolvingJob;
      manuJob.typedData.domain_name = domain;
      manuJob.publish();
    });

    await this.programService.update(programName, program);
  }

  // private async addDomainsFromProgram(subdomains: string[], programName: string) {
  //     let condition = { name: programName };
  //     let filter = { "_id": 1 };
  //     let program = await this.programService.findOneFilter(condition, filter);

  //     if(!program) {
  //         throw new HttpException("The program associated with the given job does not exist.", 400);
  //     }

  //     // split mes sous-domaines pour savoir quel serait leur premier nom de domains. Maybe faire une structure de donnes genre k:v avec tld:sousdomaines
  //     // valider dans la BD si le nom de domaine existe
  //     // si il existe pas, l'ajouter
  //     // si il existe, le download et le modifier
  //     //      si d'autres noms de domaines commencent par le meme, en profiter pour les ajouter
  //     //      update
  //     //
  //     // make sure que les concurrent writes dans les arrays fonctionnent bien
  //     // Pour ca, considerer des update precis en utilisant push, maybe aussi upsert (update insert)

  //     let subDict = {};
  //     subdomains.forEach(s => {
  //         let arr = DomainTreeUtils.domainNameToReversedStringArray(s);
  //         if (!subDict[arr[0]]) {
  //             subDict[arr[0]] = [];
  //         }
  //         subDict[arr[0]].push(arr);
  //     });

  //     Object.keys(subDict).forEach(keyDomain => {
  //         this.programService.updateOneFilter({"name": programName, "domains.name":keyDomain},{"$push": { "domains.$.subdomains": }})
  //     });

  //     let newDomains: string[] = [];
  //     subdomains.forEach(domainName => {
  //         newDomains.push.apply(newDomains, DomainTreeUtils.growDomainTree(program, domainName));
  //     });

  //     this.reportService.addNewDomains(programName, subdomains);

  //     // For each new domain name found, create a domain name resolution job for the domain
  //     newDomains.forEach(domain => {
  //         let manuJob: DomainNameResolvingJob = this.jobService.manufactureJob(JobTypes.DOMAIN_NAME_RESOLVING, programName) as DomainNameResolvingJob;
  //         manuJob.typedData.domain_name = domain;
  //         manuJob.publish();
  //     });

  //     await this.programService.update(condition, program);
  // }

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
