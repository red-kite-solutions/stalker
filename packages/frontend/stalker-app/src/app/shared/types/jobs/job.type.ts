import { JobOutputResponse } from '../../../api/jobs/jobs/jobs.socketio-client';

export interface JobListEntry extends JobInput {
  builtIn: boolean;
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
