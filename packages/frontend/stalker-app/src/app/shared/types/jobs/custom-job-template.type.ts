import { CustomJobFindingHandlerLanguage, CustomJobLanguage, CustomJobType } from './custom-job.type';
import { JobParameterDefinition } from './job.type';

export interface CustomJobTemplateSummary {
  _id: string;
  name: string;
  templateOrdering?: string;
}

export interface CustomJobTemplate extends CustomJobTemplateSummary {
  code: string;
  type: CustomJobType;
  language: CustomJobLanguage;
  builtIn?: boolean;
  parameters: JobParameterDefinition[];
  jobPodConfigId?: string;
  findingHandlerEnabled?: boolean;
  findingHandler?: string;
  findingHandlerLanguage?: CustomJobFindingHandlerLanguage;
  builtInFilePath?: string;
}
