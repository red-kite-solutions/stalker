import { isProd } from '../../../modules/app.constants';

// HACK: This should probably be configured with an environment variable,
// but we kind of need to ship this workspaces feature.
export const JOB_FOLDERS_PATH = isProd()
  ? '/server/dist/src/modules/database/custom-jobs/built-in/'
  : './src/modules/database/custom-jobs/built-in/';
export const CODE_JOB_FOLDER = 'code/';
export const NUCLEI_JOB_FOLDER = 'nuclei/';
export const CODE_JOB_FILES_PATH = `${JOB_FOLDERS_PATH}${CODE_JOB_FOLDER}`;
export const NUCLEI_JOB_FILES_PATH = `${JOB_FOLDERS_PATH}${NUCLEI_JOB_FOLDER}`;
export const ALL_JOB_FILE_PATHS = [CODE_JOB_FILES_PATH, NUCLEI_JOB_FILES_PATH];
export const HANDLER_FILE_NAME_PART = 'handler';
