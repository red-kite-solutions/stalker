import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UpdateFilter } from 'mongodb';
import { Model } from 'mongoose';
import { isConsumerMode } from '../../app.constants';
import { DataSources } from '../../datasources/data-sources';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { JobContainer } from '../container/job-container.model';
import { CustomJobEntry } from '../custom-jobs/custom-jobs.model';
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
      getModelToken('jobContainers'),
      DataSources,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobTemplatesModel: Model<CustomJobTemplate>,
      jpcModel: Model<JobPodConfiguration>,
      containerModel: Model<JobContainer>,
      dataSources: DataSources,
    ) => {
      if (isConsumerMode()) return;
      const logger = new Logger('jobTemplatesInitProvider');

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
          const importedJobs = await source.synchronize(
            podConfigs,
            containers,
            true,
          );

          for (const job of importedJobs) {
            const filter: UpdateFilter<CustomJobEntry> = {
              name: job.name,
              'source.repoUrl': job.source?.repoUrl,
            };

            await jobTemplatesModel.findOneAndUpdate(filter, job, {
              upsert: true,
              returnDocument: 'after',
            });
          }
        }
      } catch (e) {
        logger.error(e);
      }
    },
  },
];
