import { PortFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class PortCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    projectId: string,
    commandType: string,
    public readonly finding: PortFinding,
  ) {
    super(jobId, projectId, commandType);
  }
}
