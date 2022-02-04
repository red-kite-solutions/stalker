import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { KeybaseModule } from 'src/modules/alerts/keybase/keybase.module';
import { ConfigController } from './config.controller';
import { ConfigSchema } from './config.model';
import { ConfigService } from './config.service';



@Module({
    imports: [MongooseModule.forFeature([{
        name: "config",
        schema: ConfigSchema
        }]),
    KeybaseModule],
    controllers: [ConfigController],
    providers: [ConfigService],
    exports: [ConfigService]
})
export class ConfigModule {}
