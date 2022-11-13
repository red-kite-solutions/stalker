export class FindingCommand {}

export class JobFindingCommand extends FindingCommand {
  constructor(public readonly jobId) {
    super();
  }
}

export class HostnameIpCommand extends JobFindingCommand {
  constructor(
    jobId,
    public readonly domainName: string,
    public readonly ips: string[],
  ) {
    super(jobId);
  }
}
