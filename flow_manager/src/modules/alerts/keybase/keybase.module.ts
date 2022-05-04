import { Module } from '@nestjs/common';
import { ConfigModule } from '../../database/admin/config/config.module';
import { KeybaseController } from './keybase.controller';
import { KeybaseService } from './keybase.service';

@Module({
  imports: [ConfigModule],
  controllers: [KeybaseController],
  providers: [KeybaseService],
  exports: [KeybaseService],
})
export class KeybaseModule {}
