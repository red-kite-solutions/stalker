import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { MongooseModule } from "@nestjs/mongoose";
import { ProgramModule } from './reporting/program.module';
import { DomainsModule } from './reporting/domain/domain.module';
import { HostModule } from './reporting/host/host.module';
import { ReportModule } from './reporting/report/report.module';
import { ConfigModule } from './admin/config/config.module';

@Module({
    imports: [
        MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }),
        JobsModule,
        ProgramModule,
        DomainsModule,
        HostModule,
        ReportModule,
        ConfigModule
    ],
    exports: [JobsModule]
})
export class DatabaseModule {}