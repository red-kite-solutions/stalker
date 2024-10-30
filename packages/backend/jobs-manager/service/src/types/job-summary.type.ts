import { DataSource } from '../modules/database/data-source/data-source.model';
import { JobParameterDefinition } from './job-parameter-definition.type';

export interface JobSummary {
  name: string;
  parameters: JobParameterDefinition[];
  builtIn?: boolean;
  source?: DataSource;
}
