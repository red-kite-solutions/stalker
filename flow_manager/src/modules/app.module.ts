import { Module } from '@nestjs/common';
import { KeybaseModule } from './alerts/keybase/keybase.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FindingsModule } from './findings/findings.module';

@Module({
  imports: [DatabaseModule, KeybaseModule, AuthModule, FindingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
