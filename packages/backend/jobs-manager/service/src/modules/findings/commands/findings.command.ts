import { Finding } from '../findings.service';

export abstract class FindingCommand {
  public abstract finding: Finding;
  constructor(
    public readonly projectId: string,
    public readonly commandType: string,
  ) {}
}

export abstract class JobFindingCommand extends FindingCommand {
  constructor(
    public readonly jobId,
    projectId: string,
    commandType: string,
  ) {
    super(projectId, commandType);
  }
}
