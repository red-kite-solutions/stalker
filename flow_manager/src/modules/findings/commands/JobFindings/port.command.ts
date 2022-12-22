import { PortFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class PortCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly finding: PortFinding,
  ) {
    super(jobId, companyId, commandType);
  }
}
