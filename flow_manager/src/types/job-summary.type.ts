import { JobParameterDefinition } from './job-parameter-definition.type';

export interface JobSummary {
  name: string;
  parameters: JobParameterDefinition[];
  source: string;
}
