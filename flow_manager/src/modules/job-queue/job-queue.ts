export abstract class JobQueue {
  public abstract publish(...jobs: any[]): Promise<void>;
}
