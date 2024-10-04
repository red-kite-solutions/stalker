import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobModelUpdateQueue } from '../../job-queue/job-model-update-queue';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobEntry } from './custom-jobs.model';
import { GitJobSource } from './jobs.source';

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
      jobsModel: Model<CustomJobEntry>,
      jpcModel: Model<JobPodConfiguration>,
      jobCodeQueue: JobModelUpdateQueue,
    ) => {
      await jobsModel.deleteMany({ builtIn: true });
      const podConfigs = await jpcModel.find();

      const jobSources = [
        new GitJobSource(
          'https://github.com/red-kite-solutions/stalker-templates-community',
        ),
      ];

      for (const source of jobSources) {
        const importedJobs = await source.synchronize(podConfigs);
        for (const job of importedJobs) {
          const created = await jobsModel.create(job);
          jobCodeQueue.publish(created);
        }
      }
    },
  },
];
