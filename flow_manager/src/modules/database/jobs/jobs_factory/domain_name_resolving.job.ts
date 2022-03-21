import { JobsService } from 'src/modules/database/jobs/jobs.service';
import { ManufacturedJob } from 'src/modules/database/jobs/jobs_factory/manufactured_job';

export interface DomainNameResolvingJobData {
  domain_name: string;
}

export class DomainNameResolvingJob extends ManufacturedJob {
  typedData: DomainNameResolvingJobData;

  constructor(dbJobService: JobsService, program: string) {
    super(dbJobService, program);
    this.task = 'domain name resolving';
    this.priority = 3;
    this.typedData = { domain_name: '' } as DomainNameResolvingJobData;
  }

  public async saveToDatabase() {
    this.data = this.typedData;
    await super.saveToDatabase();
  }

  public addToJobQueue() {
    this.data = this.typedData;
    super.addToJobQueue();
  }
}
