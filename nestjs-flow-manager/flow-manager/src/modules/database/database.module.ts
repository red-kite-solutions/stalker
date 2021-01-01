import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { TypegooseModule } from "nestjs-typegoose";

@Module({
    imports: [
        TypegooseModule.forRoot("mongodb://localhost:27017/recon_automation", {
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