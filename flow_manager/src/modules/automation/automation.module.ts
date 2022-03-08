import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { JobsModule } from '../database/jobs/jobs.module';
import { DomainsModule } from '../database/reporting/domain/domain.module';
import { ProgramModule } from '../database/reporting/program.module';
import { AutomationController } from './automation.controller';
// import { JobsController } from './automation.controller';
// import { JobSchema } from './automation.model';
import { AutomationService } from './automation.service';


@Module({
    imports: [JobsModule, DomainsModule, ProgramModule],
    controllers: [AutomationController],
    providers: [AutomationService],
    exports: [AutomationService]
})
export class AutomationModule {}