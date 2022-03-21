import { Module } from '@nestjs/common';
import { KeybaseController } from './keybase.controller';
import { KeybaseService } from './keybase.service';

@Module({
  imports: [],
  controllers: [KeybaseController],
  providers: [KeybaseService],
  exports: [KeybaseService],
})
export class KeybaseModule {}
