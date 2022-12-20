import { JobFindingCommand } from '../findings.command';

export class HostnameIpCommand extends JobFindingCommand {
  constructor(
    jobId,
    public readonly domainName: string,
    public readonly ips: string[],
  ) {
    super(jobId);
  }
}
