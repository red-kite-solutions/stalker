import { MongooseModule } from '@nestjs/mongoose';
import { GroupSchema } from './groups.model';

export const GroupModelModule = MongooseModule.forFeature([
  {
    name: 'groups',
    schema: GroupSchema,
  },
]);
