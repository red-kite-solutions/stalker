import { CreateCustomFinding } from '../../findings.service';
import { JobFindingCommand } from '../findings.command';

export class CustomFindingCommand extends JobFindingCommand {
  constructor(
    jobId: string,
    companyId: string,
    commandType: string,
    public readonly finding: CreateCustomFinding,
  ) {
    super(jobId, companyId, commandType);
  }
}
