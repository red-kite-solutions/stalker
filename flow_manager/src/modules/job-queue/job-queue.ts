export abstract class JobQueue {
  public abstract publish(
    ...jobs: { key: string; value: string }[]
  ): Promise<void>;
}
