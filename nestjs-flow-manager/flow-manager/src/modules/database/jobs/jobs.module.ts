import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { JobsController } from './jobs.controller';
import { jobSchema } from './jobs.model';
import { JobsService } from './jobs.service';


@Module({
    imports: [MongooseModule.forFeature([{
        name: "job",
        schema: jobSchema
        }]),
    ],
    controllers: [JobsController],
    providers: [JobsService],
    exports: []
})
export class JobsModule {}
