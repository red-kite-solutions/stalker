export interface JobListEntry extends JobInput {
  source: string;
}

export interface JobParameterDefinition {
  name: string;
  type: string;
}

export interface JobInput {
  name: string;
  parameters: JobParameterDefinition[];
}

export interface StartedJob extends JobInput {
  _id: string;
  running: boolean;
}
