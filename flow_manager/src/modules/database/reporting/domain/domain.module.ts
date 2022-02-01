import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { DomainsController } from './domain.controller';
import { DomainSchema } from './domain.model';
import { DomainsService } from './domain.service';
import { JobsModule } from '../../jobs/jobs.module';
import { ProgramModule } from '../program.module';
import { ReportModule } from '../report/report.module';


@Module({
    imports: [MongooseModule.forFeature([{
        name: "domain",
        schema: DomainSchema
        }]),
        JobsModule,
        ProgramModule,
        ReportModule
    ],
    controllers: [DomainsController],
    providers: [DomainsService],
    exports: [DomainsService]
})
export class DomainsModule {}
