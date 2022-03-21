import { Job } from 'src/modules/database/jobs/jobs.model';
import { JobsService } from '../jobs.service';
import { v4 } from 'uuid';
import { JobsQueueUtils } from 'src/utils/jobs_queue.utils';

/** Represents a Job that is built using the factory method in JobsService. The manufactured jobs are not stored as is in the database */
export abstract class ManufacturedJob extends Job {
  async saveToDatabase(): Promise<void> {
    const job = new Job();
    job.data = this.data;
    job.jobId = this.jobId;
    job.task = this.task;
    job.priority = this.priority;
    job.program = this.program;
    await this.dbJobService.create(job);
  }

  addToJobQueue(): void {
    JobsQueueUtils.add(this.jobId, this.task, this.priority, this.data);
  }

  /** This function call saves the job to the database as well as sending the job to the job queue */
  public async publish(): Promise<void> {
    await this.saveToDatabase();
    this.addToJobQueue();
  }

  protected constructor(protected dbJobService: JobsService, program: string) {
    super();
    this.dbJobService = dbJobService;
    this.jobId = v4();
    this.program = program;
  }
}
