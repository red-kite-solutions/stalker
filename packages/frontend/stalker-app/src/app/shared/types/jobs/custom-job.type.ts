import { ContainerSummary } from './container.type';
import { JobSource } from './job-source.type';

export const customJobTypes = ['code', 'nuclei'] as const;
export const customJobLanguages = ['python', 'yaml'] as const;
export const customJobFindingHandlerLanguages = ['python', undefined] as const;

export type CustomJobType = (typeof customJobTypes)[number];
export type CustomJobLanguage = (typeof customJobLanguages)[number];
export type CustomJobFindingHandlerLanguage = (typeof customJobFindingHandlerLanguages)[number];
export type LanguageExtension = 'py' | 'yaml';

export interface CustomJobTypeDetails {
  type: CustomJobType;
  language: CustomJobLanguage;
  handlerLanguage: CustomJobFindingHandlerLanguage;
}

export const validCustomJobTypeDetails: CustomJobTypeDetails[] = [
  {
    type: 'code',
    language: 'python',
    handlerLanguage: undefined, // handler not supported for code custom jobs
  },
  {
    type: 'nuclei',
    language: 'yaml',
    handlerLanguage: 'python',
  },
];

export const languageExtensionMapping = {
  python: 'py',
  yaml: 'yaml',
};

export const customJobTypesLocalized = {
  code: $localize`:code|computer code:code`,
  nuclei: $localize`:nuclei|no translation required:nuclei`,
};

export interface CustomJob extends CustomJobData {
  _id: string;
}

export interface CustomJobData {
  name: string;
  code: string;
  type: CustomJobType;
  language: CustomJobLanguage;
  jobPodConfigId: string;
  findingHandlerEnabled?: boolean;
  findingHandler?: string;
  findingHandlerLanguage?: CustomJobFindingHandlerLanguage;
  source?: JobSource;
  container: ContainerSummary;
}
