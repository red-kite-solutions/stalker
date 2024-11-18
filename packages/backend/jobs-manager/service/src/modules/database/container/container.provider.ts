import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Container } from './container.model';

export const CONTAINERS_INIT = 'CONTAINERS_INIT';

export const containerInitProvider = [
  {
    provide: CONTAINERS_INIT,
    inject: [getModelToken('containers')],
    useFactory: async (containerModel: Model<Container>) => {
      const CONTAINER_ENV = 'JM_JOB_CONTAINERS';
      const logger = new Logger('containerInitProvider');

      if (!process.env[CONTAINER_ENV]) {
        logger.warn(`Missing environment variable ${CONTAINER_ENV}`);
        return;
      }

      const anyContainer = await containerModel.findOne();

      if (anyContainer) return;

      const containers = JSON.parse(process.env[CONTAINER_ENV]);

      for (const c of containers) {
        await containerModel.create({
          image: c,
        });
      }
    },
  },
];
