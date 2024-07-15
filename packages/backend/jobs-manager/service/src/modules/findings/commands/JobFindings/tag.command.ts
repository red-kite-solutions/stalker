import { TagFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class TagCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    projectId: string,
    commandType: string,
    public readonly finding: TagFinding,
  ) {
    super(jobId, projectId, commandType);
  }
}
