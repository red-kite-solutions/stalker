import { Finding } from '../findings.service';

export abstract class FindingCommand {
  public abstract finding: Finding;
  constructor(
    public readonly companyId: string,
    public readonly commandType: string,
  ) {}
}

export abstract class JobFindingCommand extends FindingCommand {
  constructor(public readonly jobId, companyId: string, commandType: string) {
    super(companyId, commandType);
  }
}
