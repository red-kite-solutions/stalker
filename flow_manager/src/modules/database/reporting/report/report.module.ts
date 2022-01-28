import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { KeybaseModule } from 'src/modules/alerts/keybase/keybase.module';
import { ReportController } from './report.controller';
import { ReportSchema } from './report.model';
import { ReportService } from './report.service';



@Module({
    imports: [MongooseModule.forFeature([{
        name: "report",
        schema: ReportSchema
        }]),
    KeybaseModule],
    controllers: [ReportController],
    providers: [ReportService],
    exports: [ReportService]
})
export class ReportModule {}
