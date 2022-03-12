import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobSchema } from './jobs.model';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'job',
        schema: JobSchema,
      },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
