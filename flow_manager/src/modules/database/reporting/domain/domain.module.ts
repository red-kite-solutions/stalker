import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { DomainsController } from './domain.controller';
import { DomainSchema } from './domain.model';
import { DomainsService } from './domain.service';
import { JobsModule } from '../../jobs/jobs.module';


@Module({
    imports: [MongooseModule.forFeature([{
        name: "domain",
        schema: DomainSchema
        }]),
        JobsModule
    ],
    controllers: [DomainsController],
    providers: [DomainsService],
    exports: []
})
export class DomainsModule {}
