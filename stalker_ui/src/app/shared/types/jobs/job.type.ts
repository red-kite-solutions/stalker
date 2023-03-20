import { JobOutputResponse } from '../../../api/jobs/jobs/jobs.socketio-client';

export interface JobListEntry extends JobInput {
  source: string;
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
  id: string;
  publishTime: number;
  startTime: number;
  endTime: number;
  task: string;
  companyId: string;
  priority: number;
  output: JobOutputResponse[];
}

export type StartedJobState = 'in-progress' | 'done' | 'errored';

export interface StartedJobViewModel {
  id: string;
  publishTime: number;
  startTime: number;
  endTime: number;
  task: string;
  companyId: string;
  priority: number;
  output: JobOutputResponse[];
  state: StartedJobState | undefined;
  numberOfErrors: number;
  numberOfWarnings: number;
  numberOfFindings: number;
}
