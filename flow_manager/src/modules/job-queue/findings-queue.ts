import { NewFinding } from '../findings/findings.service';

export abstract class FindingsQueue {
  public abstract publish(...findings: NewFinding[]): Promise<void>;
}
