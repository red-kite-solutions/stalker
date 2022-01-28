import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { HostController } from './host.controller';
import { HostSchema } from './host.model';
import { HostService } from './host.service';
import { JobsModule } from '../../jobs/jobs.module';
import { ProgramModule } from '../program.module';
import { ReportModule } from '../report/report.module';


@Module({
    imports: [MongooseModule.forFeature([{
        name: "host",
        schema: HostSchema
        }]),
        JobsModule,
        ProgramModule,
        ReportModule
    ],
    controllers: [HostController],
    providers: [HostService],
    exports: []
})
export class HostModule {}
