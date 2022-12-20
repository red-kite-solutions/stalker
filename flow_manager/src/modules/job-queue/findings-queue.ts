import { Finding } from '../findings/findings.service';

export abstract class FindingsQueue {
  public abstract publish(...findings: Finding[]): Promise<void>;
}
