export class FindingCommand {
  constructor(public readonly jobId) {}
}

export class HostnameIpCommand extends FindingCommand {
  constructor(
    jobId,
    public readonly domainName: string,
    public readonly ips: string[],
  ) {
    super(jobId);
  }
}
