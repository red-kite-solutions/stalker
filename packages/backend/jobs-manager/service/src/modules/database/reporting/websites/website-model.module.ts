import { MongooseModule } from '@nestjs/mongoose';
import { WebsiteSchema } from './website.model';

export const WebsiteModelModule = MongooseModule.forFeature([
  {
    name: 'websites',
    schema: WebsiteSchema,
  },
]);
