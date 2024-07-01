import { MongooseModule } from '@nestjs/mongoose';
import { CustomJobTemplateSchema } from './custom-job-templates.model';

export const CustomJobTemplateModelModule = MongooseModule.forFeature([
  {
    name: 'customJobTemplates',
    schema: CustomJobTemplateSchema,
  },
]);
