import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lstatSync, readdirSync } from 'node:fs';
import { DATABASE_INIT } from '../admin/config/config.provider';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { ALL_JOB_FILE_PATHS } from '../custom-jobs/custom-jobs.constants';
import { ALL_TEMPLATE_FILE_PATHS } from './custom-job-templates.constants';
import { CustomJobTemplate } from './custom-job-templates.model';
import { CustomJobTemplateUtils } from './custom-job-templates.utils';

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
      templateModel: Model<CustomJobTemplate>,
      jpcModel: Model<JobPodConfiguration>,
    ) => {
      const initTemplates = async (
        paths: string[],
        source: 'custom jobs' | 'templates',
      ) => {
        for (const fp of paths) {
          const files = readdirSync(fp);

          for (const file of files) {
            if (lstatSync(fp + file).isDirectory()) continue;
            const j = await CustomJobTemplateUtils.getCustomJob(
              fp,
              file,
              source,
              jpcModel,
            );

            if (!j) continue;
            await templateModel.findOneAndUpdate(
              { builtInFilePath: j.builtInFilePath },
              j,
              { upsert: true },
            );
          }
        }
      };

      await initTemplates(ALL_TEMPLATE_FILE_PATHS, 'templates');
      await initTemplates(ALL_JOB_FILE_PATHS, 'custom jobs');
    },
  },
];
