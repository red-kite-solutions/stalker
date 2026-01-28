import { Finding } from '../../findings/findings.service';

export abstract class FindingsQueue {
  public abstract publish(
    projectId: string,
    ...findings: Finding[]
  ): Promise<void>;

  public abstract publishForJob(
    jobId: string,
    projectId,
    ...findings: Finding[]
  ): Promise<void>;
}
