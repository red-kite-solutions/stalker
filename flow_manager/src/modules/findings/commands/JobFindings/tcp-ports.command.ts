import { JobFindingCommand } from '../findings.command';

export class TcpPortsCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly ip: string,
    public readonly ports: number[],
  ) {
    super(jobId, companyId, commandType);
  }
}
