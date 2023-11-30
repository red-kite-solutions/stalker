import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronSubscriptionsModule } from './subscriptions/cron-subscriptions/cron-subscriptions.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
    }),
    CronSubscriptionsModule,
  ],
  exports: [],
})
export class DatabaseModule {}
