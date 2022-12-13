export class FindingCommand {
  constructor(
    public readonly companyId: string,
    public readonly commandType: string,
  ) {}
}

export class JobFindingCommand extends FindingCommand {
  constructor(public readonly jobId, companyId: string, commandType: string) {
    super(companyId, commandType);
  }
}
