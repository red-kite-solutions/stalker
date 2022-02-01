import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { KeybaseModule } from './alerts/keybase/keybase.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationModule } from './automation/automation.module';

@Module({
    imports: [
        DatabaseModule, 
        KeybaseModule,
        AutomationModule,
        ScheduleModule.forRoot()
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
