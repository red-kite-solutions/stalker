import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isConsumerMode } from '../../../app.constants';
import {
  DEFAULT_GENERAL_CONFIG,
  DEFAULT_JOB_POD_CONFIG,
} from './config.default';
import { Config } from './config.model';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

export const DATABASE_INIT = 'DATABASE_INIT';

export const databaseConfigInitProvider = [
  {
    provide: DATABASE_INIT,
    inject: [getModelToken('jobPodConfig'), getModelToken('config')],
    useFactory: async (
      jobPodConfigModel: Model<JobPodConfiguration>,
      config: Model<Config>,
    ) => {
      if (isConsumerMode()) return;
      const jpConf = await jobPodConfigModel.findOne();
      if (!jpConf) {
        const jobPodConfigs: JobPodConfiguration[] = JSON.parse(
          JSON.stringify(DEFAULT_JOB_POD_CONFIG),
        );
        for (const c of jobPodConfigs) {
          await jobPodConfigModel.create(c);
        }
      }

      const currentConfig = await config.findOne();
      if (!currentConfig) {
        await config.create(DEFAULT_GENERAL_CONFIG);
      }

      return DATABASE_INIT;
    },
  },
];
