import { isProd } from '../../app.constants';

export const JOB_FOLDERS_PATH = isProd()
  ? '/server/dist/src/modules/database/custom-job-templates/built-in/'
  : './src/modules/database/custom-job-templates/built-in/';
export const CODE_JOB_FOLDER = 'code/';
export const NUCLEI_JOB_FOLDER = 'nuclei/';
export const CODE_JOB_TEMPLATE_FILES_PATH = `${JOB_FOLDERS_PATH}${CODE_JOB_FOLDER}`;
export const NUCLEI_JOB_TEMPLATE_FILES_PATH = `${JOB_FOLDERS_PATH}${NUCLEI_JOB_FOLDER}`;
export const ALL_TEMPLATE_FILE_PATHS = [
  CODE_JOB_TEMPLATE_FILES_PATH,
  NUCLEI_JOB_TEMPLATE_FILES_PATH,
];
