import { CustomJobsDocument } from '../../database/custom-jobs/custom-jobs.model';

export abstract class JobModelUpdateQueue {
  public abstract publish(
    ...jobCodeUpdates: CustomJobsDocument[]
  ): Promise<void>;
}
