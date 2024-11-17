import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UpdateFilter } from 'mongodb';
import { Model } from 'mongoose';
import { DataSources } from '../../datasources/data-sources';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
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
      DataSources,
      { token: DATABASE_INIT, optional: false },
    ],
    useFactory: async (
      jobTemplatesModel: Model<CustomJobTemplate>,
      jpcModel: Model<JobPodConfiguration>,
      dataSources: DataSources,
    ) => {
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

        for (const source of sources) {
          const importedJobs = await source.synchronize(podConfigs, true);
          logger.debug(
            `Found ${importedJobs.length} jobs to import from source ${source}`,
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
