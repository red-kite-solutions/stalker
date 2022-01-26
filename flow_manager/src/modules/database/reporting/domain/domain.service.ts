import { InjectModel } from "@nestjs/mongoose";
import { HttpException, Injectable } from "@nestjs/common";
import { Domain } from './domain.model'
import { BaseService } from "../../../../services/base.service";
import { SubmitSubdomainDto, SubmitSubdomainManuallyDto } from "./domain.dto";
import { Model } from "mongoose";
import { JobsService, JobTypes } from "../../jobs/jobs.service";
import { ProgramService } from "../program.service";
import { DomainTreeUtils } from '../../../../utils/domain_tree.utils';
import { DomainsModule } from "./domain.module";
import { DomainNameResolvingJob } from "../../jobs/jobs_factory/domain_name_resolving.job";


@Injectable()
export class DomainsService extends BaseService<Domain, Domain> {
    constructor(@InjectModel("domain") private readonly domainModel: Model<Domain>,
            private jobService: JobsService,
            private programService: ProgramService) {
        super(domainModel);
    }

    private async addDomainsFromProgram(subdomains: string[], programName: string) {
        let programFilter = { name: programName }; 
        let program = await this.programService.findOne(programFilter);

        if(!program) {
            throw new HttpException("The program associated with the given job does not exist.", 400);
        }

        let newDomains: string[] = [];
        subdomains.forEach((domainName, i) => {
            newDomains.push.apply(newDomains, DomainTreeUtils.growDomainTree(program, domainName));
        });

        // For each new domain name found, create a domain name resolution job for the domain
        newDomains.forEach(domain => {
            let manuJob: DomainNameResolvingJob = this.jobService.manufactureJob(JobTypes.DOMAIN_NAME_RESOLVING) as DomainNameResolvingJob;
            manuJob.typedData.domain_name = domain;
            manuJob.publish();
        });

        await this.programService.update(programFilter, program);
    }

    public async addDomains(dto: SubmitSubdomainDto, jobId: string) {
        // Find the proper program using the jobId and then the program name 
        let job = await this.jobService.findOne({ jobId: jobId });

        if(!job) {
            throw new HttpException("The job id is invalid.", 400);
        }

        await this.addDomainsFromProgram(dto.subdomains, job.program);
    }

    public async addDomainsManually(dto: SubmitSubdomainManuallyDto) {
        await this.addDomainsFromProgram(dto.subdomains, dto.program);
    }
}