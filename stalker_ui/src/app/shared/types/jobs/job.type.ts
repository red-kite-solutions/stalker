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
}
