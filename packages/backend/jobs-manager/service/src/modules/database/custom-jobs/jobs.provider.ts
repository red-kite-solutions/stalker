import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UpdateFilter } from 'mongodb';
import { Model } from 'mongoose';
import { isConsumerMode } from '../../app.constants';
import { DataSources } from '../../datasources/data-sources';
import { JobModelUpdateQueue } from '../../queues/job-model-update-queue/job-model-update-queue';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { JobContainer } from '../container/job-container.model';
import { CustomJobEntry } from './custom-jobs.model';
import { GitJobSource, JobSource, JobSourceConfig } from './jobs.source';

export const JOBS_INIT = 'JOBS_INIT';

export const jobsInitProvider = [
  {
    provide: JOBS_INIT,
    inject: [
      getModelToken('customJobs'),
      getModelToken('jobPodConfig'),
      getModelToken('jobContainers'),
      JobModelUpdateQueue,
      DataSources,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobsModel: Model<CustomJobEntry>,
      jpcModel: Model<JobPodConfiguration>,
      containerModel: Model<JobContainer>,
      jobCodeQueue: JobModelUpdateQueue,
      dataSources: DataSources,
    ) => {
      if (isConsumerMode()) return;
      const logger = new Logger('jobsInitProvider');

      try {
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

        const containers = await containerModel.find();

        for (const source of sources) {
          const importedJobs = await source.synchronize(podConfigs, containers);
          for (const job of importedJobs) {
            const filter: UpdateFilter<CustomJobEntry> = {
              name: job.name,
              'source.repoUrl': job.source?.repoUrl,
            };

            const updated = await jobsModel.findOneAndUpdate(filter, job, {
              upsert: true,
              returnDocument: 'after',
            });

            jobCodeQueue.publish(updated);
          }
        }
      } catch (e) {
        logger.error(e);
      }
    },
  },
];
