import { JobOutputResponse } from '../../../api/jobs/job-executions/job-executions.socketio-client';
import { DataSource } from '../data-source/data-source.type';

export interface JobListEntry extends JobInput {
  builtIn: boolean;
  source: DataSource;
}

export interface JobParameterDefinition {
  name: string;
  type: string;
  default?: any;
}

export interface JobInput {
  name: string;
  parameters: JobParameterDefinition[];
}

export interface StartedJob extends JobInput {
  _id: string;
  id: string;
  publishTime: number;
  startTime: number;
  endTime: number;
  task: string;
  projectId: string;
  priority: number;
  output: JobOutputResponse[];
}

export interface StartedJobOutputMetadata extends StartedJob {
  numberOfErrors: number;
  numberOfWarnings: number;
  numberOfFindings: number;
}

export type StartedJobState = 'in-progress' | 'done' | 'errored';

export interface StartedJobViewModel {
  id: string;
  publishTime: number;
  startTimestamp: number;
  startTime: Date | undefined;
  endTimestamp: number;
  endTime: Date | undefined;
  task: string;
  name: string;
  projectId: string;
  priority: number;
  output: JobOutputResponse[];
  state: StartedJobState | undefined;
  numberOfErrors: number;
  numberOfWarnings: number;
  numberOfFindings: number;
}
