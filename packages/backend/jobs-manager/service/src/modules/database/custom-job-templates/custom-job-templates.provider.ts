import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DataSources } from '../../datasources/data-sources';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import {
  GitJobSource,
  JobSource,
  JobSourceConfig,
} from '../custom-jobs/jobs.source';
import { CustomJobTemplate } from './custom-job-templates.model';

export const JOBS_INIT = 'JOBS_INIT';

export const jobTemplatesInitProvider = [
  {
    provide: JOBS_INIT,
    inject: [
      getModelToken('customJobTemplates'),
      getModelToken('jobPodConfig'),
      DataSources,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobTemplatesModel: Model<CustomJobTemplate>,
      jpcModel: Model<JobPodConfiguration>,
      dataSources: DataSources,
    ) => {
      await jobTemplatesModel.deleteMany();
      const podConfigs = await jpcModel.find();

      const sourceConfigs: JobSourceConfig[] =
        process.env.DATA_SOURCES != null
          ? JSON.parse(process.env.DATA_SOURCES) ?? undefined
          : [];

      const sources: JobSource[] = [];
      for (const source of sourceConfigs) {
        const dataSource = await dataSources.get(source);
        sources.push(new GitJobSource(dataSource));
      }

      for (const source of sources) {
        const importedJobs = await source.synchronize(podConfigs, true);
        for (const job of importedJobs) {
          await jobTemplatesModel.create(job);
        }
      }
    },
  },
];
