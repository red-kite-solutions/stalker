import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { KeybaseController } from './keybase.controller';
// import { ProgramSchema } from './keybase.model';
import { KeybaseService } from './keybase.service';



@Module({
    imports: [],
    controllers: [KeybaseController],
    providers: [KeybaseService],
    exports: [KeybaseService]
})
export class KeybaseModule {}
