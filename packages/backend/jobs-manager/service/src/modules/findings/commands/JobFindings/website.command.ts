import { WebsiteFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class WebsiteCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    projectId: string,
    commandType: string,
    public readonly finding: WebsiteFinding,
  ) {
    super(jobId, projectId, commandType);
  }
}
