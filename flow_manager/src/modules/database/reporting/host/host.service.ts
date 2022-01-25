import { InjectModel } from "@nestjs/mongoose";
import { HttpException, Injectable } from "@nestjs/common";
import { Host } from './host.model'
import { BaseService } from "../../../../services/base.service";
import { SubmitHostDto } from "./host.dto";
import { Model } from "mongoose";
import { JobsService } from "../../jobs/jobs.service";
import { ProgramService } from "../program.service";
import { DomainTreeUtils } from '../../../../utils/domain_tree.utils';
import { Domain } from "../domain/domain.model";


@Injectable()
export class HostService extends BaseService<Host, Host> {
    constructor(@InjectModel("host") private readonly hostModel: Model<Host>,
            private jobService: JobsService,
            private programService: ProgramService) {
        super(hostModel);
    }

    public async addHostsToDomain(dto: SubmitHostDto, jobId: string) {
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


        let domain: Domain = DomainTreeUtils.findDomainObject(program, dto.domainName);

        console.log("in service: domain.name: " + domain.name);

        if (!domain.hosts) {
            domain.hosts = [];
            dto.ips.forEach(ip => {
                let newHost = new Host();
                newHost.ip = ip;
                domain.hosts.push(newHost);
            });
        } else {
            dto.ips.forEach(ip => {
                if(!dto.ips.includes(ip)) {
                    let newHost = new Host();
                    newHost.ip = ip;
                    domain.hosts.push();
                }
            });
        } 

        await this.programService.update(programFilter, program);
    }
}