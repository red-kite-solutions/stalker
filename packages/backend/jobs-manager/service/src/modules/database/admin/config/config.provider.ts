import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_JOB_POD_CONFIG } from './config.default';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

export const DATABASE_INIT = 'DATABASE_INIT';

export const databaseConfigInitProvider = [
  {
    provide: DATABASE_INIT,
    inject: [getModelToken('jobPodConfig')],
    useFactory: async (jobPodConfigModel: Model<JobPodConfiguration>) => {
      const jpConf = await jobPodConfigModel.findOne();
      if (!jpConf) {
        const jobPodConfigs: JobPodConfiguration[] = JSON.parse(
          JSON.stringify(DEFAULT_JOB_POD_CONFIG),
        );
        for (const c of jobPodConfigs) {
          await jobPodConfigModel.create(c);
        }
      }
      return DATABASE_INIT;
    },
  },
];
