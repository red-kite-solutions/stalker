import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { MongooseModule } from "@nestjs/mongoose";

@Module({
    imports: [
        MongooseModule.forRoot("mongodb://localhost:27017/recon_automation", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }),
        JobsModule
    ],
    // imports: [
    //     TypegooseModule.forRootAsync({
    //         useFactory: () => ({
    //           uri: 'mongodb://localhost:27017/recon_automation',
    //         }),
    //     }),
    //     JobsModule
    // ],
    exports: [JobsModule]
})
export class DatabaseModule {}