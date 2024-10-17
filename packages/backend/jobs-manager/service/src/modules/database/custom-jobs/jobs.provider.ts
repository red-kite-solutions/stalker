import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DataSources } from '../../datasources/data-sources';
import { JobModelUpdateQueue } from '../../job-queue/job-model-update-queue';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobEntry } from './custom-jobs.model';
import { GitJobSource, JobSource, JobSourceConfig } from './jobs.source';

export const JOBS_INIT = 'JOBS_INIT';

export const jobsInitProvider = [
  {
    provide: JOBS_INIT,
    inject: [
      getModelToken('customJobs'),
      getModelToken('jobPodConfig'),
      JobModelUpdateQueue,
      DataSources,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobsModel: Model<CustomJobEntry>,
      jpcModel: Model<JobPodConfiguration>,
      jobCodeQueue: JobModelUpdateQueue,
      dataSources: DataSources,
    ) => {
      await jobsModel.deleteMany({ builtIn: true });
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
        const importedJobs = await source.synchronize(podConfigs);
        for (const job of importedJobs) {
          const created = await jobsModel.create(job);
          jobCodeQueue.publish(created);
        }
      }
    },
  },
];
