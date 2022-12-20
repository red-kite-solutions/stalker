import { JobFindingCommand } from '../findings.command';

export class TcpPortsCommand extends JobFindingCommand {
  constructor(
    jobId,
    public readonly ip: string,
    public readonly ports: number[],
  ) {
    super(jobId);
  }
}
