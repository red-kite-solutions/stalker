import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './admin/config/config.module';
import { JobsModule } from './jobs/jobs.module';
import { CompanyModule } from './reporting/company.module';
import { ReportModule } from './reporting/report/report.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      dbName: process.env.MONGO_DATABASE_NAME,
    }),
    JobsModule,
    CompanyModule,
    ReportModule,
    ConfigModule,
  ],
  exports: [JobsModule],
})
export class DatabaseModule {}
