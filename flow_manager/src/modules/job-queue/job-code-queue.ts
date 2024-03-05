import { CustomJobsDocument } from '../database/custom-jobs/custom-jobs.model';

export abstract class JobCodeQueue {
  public abstract publish(
    ...jobCodeUpdates: CustomJobsDocument[]
  ): Promise<void>;
}
