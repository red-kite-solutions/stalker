import { JobFindingCommand } from '../findings.command';

export class PortCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly ip: string,
    public readonly port: number,
    public readonly protocol: 'tcp' | 'udp',
  ) {
    super(jobId, companyId, commandType);
  }
}
