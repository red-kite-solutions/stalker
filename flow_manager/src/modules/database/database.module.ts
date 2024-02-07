import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './admin/config/config.module';
import { CustomJobsModule } from './custom-jobs/custom-jobs.module';
import { JobsModule } from './jobs/jobs.module';
import { ProjectModule } from './reporting/project.module';
import { SecretsModule } from './secrets/secrets.module';
import { CronSubscriptionsModule } from './subscriptions/cron-subscriptions/cron-subscriptions.module';
import { EventSubscriptionsModule } from './subscriptions/event-subscriptions/event-subscriptions.module';
import { TagsModule } from './tags/tag.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: true,
      tlsCAFile: '/certs/ca.pem',
      tlsCertificateFile: '/certs/client-signed.crt',
      tlsCertificateKeyFile: '/certs/client.key',
      tlsCertificateKeyFilePassword: process.env.FM_MONGO_KEY_PASSWORD,
    }),
    JobsModule,
    ProjectModule,
    ConfigModule,
    TagsModule,
    EventSubscriptionsModule,
    CronSubscriptionsModule,
    CustomJobsModule,
    SecretsModule,
  ],
  exports: [JobsModule],
  providers: [],
  controllers: [],
})
export class DatabaseModule {}
