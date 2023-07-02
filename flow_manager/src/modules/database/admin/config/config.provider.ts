import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_CONFIG, DEFAULT_JOB_POD_CONFIG } from './config.default';
import { Config } from './config.model';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

export const DATABASE_INIT = 'DATABASE_INIT';

export const databaseConfigInitProvider = [
  {
    provide: DATABASE_INIT,
    inject: [getModelToken('config'), getModelToken('jobPodConfig')],
    useFactory: async (
      configModel: Model<Config>,
      jobPodConfigModel: Model<JobPodConfiguration>,
    ) => {
      const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      await configModel.findOneAndUpdate(
        {},
        { $setOnInsert: config },
        { upsert: true, useFindAndModify: false },
      );

      const jpConf = await jobPodConfigModel.findOne();
      if (!jpConf) {
        const jobPodConfigs: JobPodConfiguration[] = JSON.parse(
          JSON.stringify(DEFAULT_JOB_POD_CONFIG),
        );
        for (const c of jobPodConfigs) {
          await jobPodConfigModel.create(c);
        }
      }
    },
  },
];
