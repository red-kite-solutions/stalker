import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { KeybaseModule } from './alerts/keybase/keybase.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationModule } from './automation/automation.module';
import { AuthMiddleware } from './database/admin/auth/api_key/auth.middleware';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        DatabaseModule, 
        KeybaseModule,
        AutomationModule,
        ScheduleModule.forRoot(),
        AuthModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
// export class AppModule implements NestModule {
//     // configure(consumer: MiddlewareConsumer) {
//     //     consumer
//     //       .apply(AuthMiddleware)
//     //       .exclude({ path: '/', method: RequestMethod.GET })
//     //       .forRoutes({ path: '*', method: RequestMethod.ALL });
//     //   }
// }
