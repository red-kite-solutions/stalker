import { MongooseModule } from '@nestjs/mongoose';
import { IpRangeSchema } from './ip-range.model';

export const IpRangeModelModule = MongooseModule.forFeature([
  {
    name: 'ipranges',
    schema: IpRangeSchema,
  },
]);
