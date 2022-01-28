import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { MongooseModule } from "@nestjs/mongoose";
import { ProgramModule } from './reporting/program.module';
import { DomainsModule } from './reporting/domain/domain.module';
import { HostModule } from './reporting/host/host.module';
import { ReportModule } from './reporting/report/report.module';

@Module({
    imports: [
        MongooseModule.forRoot("mongodb://localhost:27017/recon_automation", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }),
        JobsModule,
        ProgramModule,
        DomainsModule,
        HostModule,
        ReportModule
    ],
    exports: [JobsModule]
})
export class DatabaseModule {}