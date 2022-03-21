import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KeybaseModule } from './alerts/keybase/keybase.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AutomationModule } from './automation/automation.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    KeybaseModule,
    AutomationModule,
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
