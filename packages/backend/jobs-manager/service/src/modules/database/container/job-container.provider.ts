import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobContainer } from './job-container.model';

export const JOB_CONTAINERS_INIT = 'JOB_CONTAINERS_INIT';

export const jobContainerInitProvider = [
  {
    provide: JOB_CONTAINERS_INIT,
    inject: [getModelToken('jobContainers')],
    useFactory: async (containerModel: Model<JobContainer>) => {
      const CONTAINER_ENV = 'JM_JOB_CONTAINERS';
      const logger = new Logger('containerInitProvider');

      if (!process.env[CONTAINER_ENV]) {
        logger.warn(`Missing environment variable ${CONTAINER_ENV}`);
        return;
      }

      const allContainers = await containerModel.find();

      const containers = JSON.parse(process.env[CONTAINER_ENV]);

      for (const c of containers) {
        if (
          allContainers.find(
            (existingContainer) => existingContainer.image === c,
          )
        )
          continue;

        logger.debug(`Adding container ${c}`);
        await containerModel.create({
          image: c,
        });
      }
    },
  },
];
