
import { JobsService } from "src/modules/database/jobs/jobs.service";
import { ManufacturedJob } from "src/modules/database/jobs/jobs_factory/manufactured_job"

export interface SubdomainBruteforceJobData {
    domain_name: string;
    wordlist: string;
}

export class SubdomainBruteforceJob extends ManufacturedJob {

    typedData: SubdomainBruteforceJobData;

    constructor(protected dbJobService: JobsService) {
        super(dbJobService);
        this.task = "subdomain bruteforce";
        this.priority = 3;
        this.typedData.domain_name = "";
        this.typedData.wordlist = "";
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