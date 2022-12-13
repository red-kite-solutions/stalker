import { HostnameIpFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class HostnameIpCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly finding: HostnameIpFinding,
  ) {
    super(jobId, companyId, commandType);
  }
}
