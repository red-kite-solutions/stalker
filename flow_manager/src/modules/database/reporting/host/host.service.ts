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
import { ReportService } from "../report/report.service";


@Injectable()
export class HostService extends BaseService<Host, Host> {
    constructor(@InjectModel("host") private readonly hostModel: Model<Host>,
            private jobService: JobsService,
            private programService: ProgramService,
            private reportService: ReportService) {
        super(hostModel);
    }

    public async addHostsToDomain(dto: SubmitHostDto, jobId: string) {
        // Find the proper program using the jobId and then the program name 
        let job = await this.jobService.findOne({ jobId: jobId });

        if(!job) {
            console.log("Could not find the job " + jobId);
            throw new HttpException("The job id is invalid.", 400);
        }
        let programFilter = { name: job.program }; 
        let program = await this.programService.findOne(programFilter);

        if(!program) {
            console.log("Could not find the program " + job.program);
            throw new HttpException("The program associated with the given job does not exist.", 400);
        }

        let domain: Domain = DomainTreeUtils.findDomainObject(program, dto.domainName);

        if (!domain) {
            throw new HttpException("The given subdomain is not part of the given program. Maybe it needs to be added.", 500);
        }
        let newIps: string[] = [];

        if (!domain.hosts) {
            domain.hosts = [];
            newIps = dto.ips;
            dto.ips.forEach(ip => {
                let newHost = new Host();
                newHost.ip = ip;
                domain.hosts.push(newHost);
            });
        } else {
            
            dto.ips.forEach(ip => {
                if (!domain.hosts.some(host => host.ip === ip)) {
                    let newHost = new Host();
                    newHost.ip = ip;
                    domain.hosts.push(newHost);
                    newIps.push(ip);
                }
            });
        }

        this.reportService.addNewHosts(program.name, dto.domainName, dto.ips);

        await this.programService.update(programFilter, program);
        await this.jobService.remove({ jobId: jobId });
    }
}