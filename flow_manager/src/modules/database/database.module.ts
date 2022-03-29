import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './admin/config/config.module';
import { JobsModule } from './jobs/jobs.module';
import { DomainsModule } from './reporting/domain/domain.module';
import { HostModule } from './reporting/host/host.module';
import { ProgramModule } from './reporting/program.module';
import { ReportModule } from './reporting/report/report.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    JobsModule,
    ProgramModule,
    DomainsModule,
    HostModule,
    ReportModule,
    ConfigModule,
  ],
  exports: [JobsModule],
})
export class DatabaseModule {}
