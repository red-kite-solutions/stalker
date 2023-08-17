import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
    }),
    CronModule,
  ],
  exports: [],
})
export class DatabaseModule {}
