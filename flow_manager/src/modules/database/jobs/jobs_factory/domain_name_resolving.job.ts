
import { JobsService } from "src/modules/database/jobs/jobs.service";
import { ManufacturedJob } from "src/modules/database/jobs/jobs_factory/manufactured_job"
import { Job } from "../jobs.model";

export interface DomainNameResolvingJobData {
    domain_name: string;
}

export class DomainNameResolvingJob extends ManufacturedJob {

    typedData: DomainNameResolvingJobData;

    constructor(dbJobService: JobsService) {
        super(dbJobService);
        this.task = "domain name resolving";
        this.priority = 3;
        this.typedData.domain_name = "";
        
    };

    public saveToDatabase() {
        this.data = this.typedData;
        super.saveToDatabase();
    };

    public addToJobQueue() {
        this.data = this.typedData;
        super.addToJobQueue();
    };
}