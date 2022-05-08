import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsModule } from '../jobs/jobs.module';
import { CompanyController } from './company.controller';
import { CompanySchema } from './company.model';
import { CompanyService } from './company.service';
import { DomainsModule } from './domain/domain.module';
import { HostModule } from './host/host.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'company',
        schema: CompanySchema,
      },
    ]),
    DomainsModule,
    HostModule,
    JobsModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
