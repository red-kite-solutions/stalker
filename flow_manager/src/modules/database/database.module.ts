import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './admin/config/config.module';
import { CustomJobsModule } from './custom-jobs/custom-jobs.module';
import { JobsModule } from './jobs/jobs.module';
import { CompanyModule } from './reporting/company.module';
import { ReportModule } from './reporting/report/report.module';
import { EventSubscriptionsModule } from './subscriptions/event-subscriptions/event-subscriptions.module';
import { TagsModule } from './tags/tag.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
    }),
    JobsModule,
    CompanyModule,
    ReportModule,
    ConfigModule,
    TagsModule,
    EventSubscriptionsModule,
    CustomJobsModule,
  ],
  exports: [JobsModule],
})
export class DatabaseModule {}
