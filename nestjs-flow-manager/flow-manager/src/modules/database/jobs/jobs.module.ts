import { Module } from '@nestjs/common';
import { TypegooseModule } from "nestjs-typegoose";
import { JobsController } from './jobs.controller';
import { Job } from './jobs.model';
import { JobsService } from './jobs.service';


@Module({
    imports: [TypegooseModule.forFeature([Job])],
    controllers: [JobsController],
    providers: [JobsService],
    exports: []
})
export class JobsModule {}
