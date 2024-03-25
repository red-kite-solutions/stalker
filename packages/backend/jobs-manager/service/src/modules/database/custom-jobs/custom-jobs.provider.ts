import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lstatSync, readdirSync } from 'node:fs';
import { JobModelUpdateQueue } from '../../job-queue/job-model-update-queue';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { ALL_FILE_PATHS as ALL_JOB_FILE_PATHS } from './custom-jobs.constants';
import { CustomJobEntry } from './custom-jobs.model';
import { CustomJobsUtils } from './custom-jobs.utils';

export const JOBS_INIT = 'JOBS_INIT';

export const jobsInitProvider = [
  {
    provide: JOBS_INIT,
    inject: [
      getModelToken('customJobs'),
      getModelToken('jobPodConfig'),
      JobModelUpdateQueue,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      customJobModel: Model<CustomJobEntry>,
      jpcModel: Model<JobPodConfiguration>,
      jobCodeQueue: JobModelUpdateQueue,
    ) => {
      const anyJob = await customJobModel.findOne({});
      if (!anyJob) {
        for (const fp of ALL_JOB_FILE_PATHS) {
          const files = readdirSync(fp);

          for (const file of files) {
            if (lstatSync(fp + file).isDirectory()) continue;
            const j = await CustomJobsUtils.getCustomJob(fp, file, jpcModel);
            if (!j) continue;
            const created = await customJobModel.create(j);
            jobCodeQueue.publish(created);
          }
        }
      }
    },
  },
];
