import { JobParameterDefinition } from '../../../types/job-parameter-definition.type';
import {
  CustomJobFindingHandlerLanguage,
  CustomJobLanguage,
  CustomJobType,
} from '../jobs/models/custom-job.model';

export interface CustomJobMetadata {
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
  image: string;
}
