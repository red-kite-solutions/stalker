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

export const resourceDetailsLevel = ['extended', 'full', 'summary'] as const;
export type ResourceDetailsLevel = (typeof resourceDetailsLevel)[number];

export const portDetailsLevel = [
  'extended',
  'full',
  'summary',
  'number',
] as const;
export type PortDetailsLevel = (typeof portDetailsLevel)[number];
