import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlarmModule } from './alarm/alarm.module';
import { CronSubscriptionsModule } from './subscriptions/cron-subscriptions/cron-subscriptions.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
      authSource: process.env.MONGO_DATABASE_NAME,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsCAFile: '/certs/ca.pem',
      tlsCertificateFile: '/certs/client-signed.crt',
      tlsCertificateKeyFile: '/certs/client.key',
      tlsCertificateKeyFilePassword: process.env.CRON_MONGO_KEY_PASSWORD,
    }),
    CronSubscriptionsModule,
    AlarmModule,
  ],
  exports: [],
})
export class DatabaseModule {}
