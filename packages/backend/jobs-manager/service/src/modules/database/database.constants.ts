import { SchemaOptions } from '@nestjs/mongoose';

export const MONGO_DUPLICATE_ERROR = 11000;
export const MONGO_TIMESTAMP_SCHEMA_CONFIG: SchemaOptions = {
  timestamps: {
    currentTime: () => Date.now(),
    createdAt: true,
    updatedAt: true,
  },
};
