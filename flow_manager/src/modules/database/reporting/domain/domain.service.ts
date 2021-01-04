import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { Domain } from './domain.model'
import { BaseService } from "../../../../services/base.service";
import { SubmitSubdomainDto } from "./domain.dto";
import { Model } from "mongoose";
import { JobsService } from "../../jobs/jobs.service";


@Injectable()
export class DomainsService extends BaseService<Domain, Domain> {
    constructor(@InjectModel("domain") private readonly domainModel: Model<Domain>,
            private jobService: JobsService) {
        super(domainModel);
    }

    public async findAllDomains() {
        return await this.findAll();
    }

    public async addDomain(dto: SubmitSubdomainDto, jobId: string) {
        // Find the proper program using the jobId 

        //Split the subdomains in a tree with non repeating nodes, ex: 
        // bnc.ca --> asdf.bnc.ca
        //        --> abc.bnc.ca
        //            --> a.abc.bnc.ca
        //            --> b.abc.bnc.ca
        //        --> app.bnc.ca

        // Only add subdomain if it does not yet exist

        await this.create({
            
        });
    }
}