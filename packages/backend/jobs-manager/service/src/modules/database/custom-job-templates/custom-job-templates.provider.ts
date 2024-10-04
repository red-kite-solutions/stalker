import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { GitJobSource } from '../custom-jobs/jobs.source';
import { CustomJobTemplate } from './custom-job-templates.model';

export const JOBS_INIT = 'JOBS_INIT';

export const jobTemplatesInitProvider = [
  {
    provide: JOBS_INIT,
    inject: [
      getModelToken('customJobTemplates'),
      getModelToken('jobPodConfig'),
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobTemplatesModel: Model<CustomJobTemplate>,
      jpcModel: Model<JobPodConfiguration>,
    ) => {
      await jobTemplatesModel.deleteMany();
      const podConfigs = await jpcModel.find();

      const jobSources = [
        new GitJobSource(
          'https://github.com/red-kite-solutions/stalker-templates-community',
        ),
      ];

      for (const source of jobSources) {
        const importedJobs = await source.synchronize(podConfigs, true);
        for (const job of importedJobs) {
          await jobTemplatesModel.create(job);
        }
      }
    },
  },
];
