import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgramController } from './program.controller';
import { ProgramSchema } from './program.model';
import { ProgramService } from './program.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'program',
        schema: ProgramSchema,
      },
    ]),
  ],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
