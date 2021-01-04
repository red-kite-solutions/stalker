import { InjectModel } from "@nestjs/mongoose";
import { HttpException, Injectable } from "@nestjs/common";
import { Domain } from './domain.model'
import { BaseService } from "../../../../services/base.service";
import { SubmitSubdomainDto } from "./domain.dto";
import { Model } from "mongoose";
import { JobsService } from "../../jobs/jobs.service";
import { ProgramService } from "../program.service";
import { DomainTreeUtils } from '../../../../utils/domain_tree.utils';
import { DomainsModule } from "./domain.module";


@Injectable()
export class DomainsService extends BaseService<Domain, Domain> {
    constructor(@InjectModel("domain") private readonly domainModel: Model<Domain>,
            private jobService: JobsService,
            private programService: ProgramService) {
        super(domainModel);
    }

    public async addDomains(dto: SubmitSubdomainDto, jobId: string) {
        // Find the proper program using the jobId and then the program name 
        let job = await this.jobService.findOne({ jobId: jobId });

        if(!job) {
            throw new HttpException("The job id is invalid.", 400);
        }
        let programFilter = { name: job.program }; 
        let program = await this.programService.findOne(programFilter);

        if(!program) {
            throw new HttpException("The program associated with the given job does not exist.", 400);
        }

        dto.subdomains.forEach((domainName, i) => {
            DomainTreeUtils.growDomainTree(program, domainName);
        });

        await this.programService.update(programFilter, program);
    }
}