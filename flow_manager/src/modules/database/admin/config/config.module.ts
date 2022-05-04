import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigController } from './config.controller';
import { ConfigSchema } from './config.model';
import { databaseConfigInitProvider } from './config.provider';
import { ConfigService } from './config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'config',
        schema: ConfigSchema,
      },
    ]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService, ...databaseConfigInitProvider],
  exports: [ConfigService, ...databaseConfigInitProvider],
})
export class ConfigModule {}
