import { SchemaOptions } from '@nestjs/mongoose';

export const MONGO_TIMESTAMP_FUNCTION = () => Date.now();

export const MONGO_DUPLICATE_ERROR = 11000;
export const MONGO_TIMESTAMP_SCHEMA_CONFIG: SchemaOptions = {
  timestamps: {
    currentTime: MONGO_TIMESTAMP_FUNCTION,
    createdAt: true,
    updatedAt: true,
  },
};

export const detailsLevel = ['full', 'summary', 'number'] as const;
export type DetailsLevel = (typeof detailsLevel)[number];
