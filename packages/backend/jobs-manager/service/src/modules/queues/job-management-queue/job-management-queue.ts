import { KafkaJobManagementTask } from './kafka-job-management-queue';

export abstract class JobManagementQueue {
  public abstract publish(
    ...jobManagementTasks: KafkaJobManagementTask[]
  ): Promise<void>;
}
