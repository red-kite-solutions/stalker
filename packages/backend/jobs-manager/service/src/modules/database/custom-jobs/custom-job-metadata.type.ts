import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import {
  CustomJobFindingHandlerLanguage,
  CustomJobLanguage,
  CustomJobType,
} from '../jobs/models/custom-job.model';

export interface CustomJobMetadataV1 {
  name: string;
  code: string;
  type: CustomJobType;
  language: CustomJobLanguage;
  parameters: JobParameterDefinition[];
  jobPodConfigName: string;
  findingHandlerEnabled?: boolean;
  findingHandler?: string;
  findingHandlerLanguage?: CustomJobFindingHandlerLanguage;
  builtIn?: boolean;
  codeFilePath: string;
  handlerFilePath?: string;
  category?: string;
}

export interface CustomJobMetadataV2 {
  version: 2;
  name: string;
  code: string;
  type: CustomJobType;
  language: CustomJobLanguage;
  parameters: JobParameterDefinition[];
  jobPodConfigName: string;
  findingHandlerEnabled?: boolean;
  findingHandler?: string;
  findingHandlerLanguage?: CustomJobFindingHandlerLanguage;
  builtIn?: boolean;
  category?: string;
}
