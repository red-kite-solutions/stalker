import { MongooseModule } from '@nestjs/mongoose';
import { ViewSchema } from './views.model';

export const ViewModelModule = MongooseModule.forFeature([
  {
    name: 'view',
    schema: ViewSchema,
  },
]);
