import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanySchema } from './company.model';
import { CompanyService } from './company.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'company',
        schema: CompanySchema,
      },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
