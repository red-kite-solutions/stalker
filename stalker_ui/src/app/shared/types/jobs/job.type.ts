export interface JobListEntry extends Job {
  source: string;
}

export interface JobParameterDefinition {
  name: string;
  type: string;
}

export interface Job {
  name: string;
  parameters: JobParameterDefinition[];
}
