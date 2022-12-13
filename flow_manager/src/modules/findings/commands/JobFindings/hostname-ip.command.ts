import { JobFindingCommand } from '../findings.command';

export class HostnameIpCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly domainName: string,
    public readonly ip: string,
  ) {
    super(jobId, companyId, commandType);
  }
}
