import { JobParameterDefinition } from './job-parameter-definition.type';
import { JobSource } from './job-source.type';

export interface JobSummary {
  name: string;
  parameters: JobParameterDefinition[];
  builtIn?: boolean;
  source?: JobSource;
}
