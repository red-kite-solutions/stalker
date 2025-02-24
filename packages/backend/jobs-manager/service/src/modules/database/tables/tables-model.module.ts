import { MongooseModule } from '@nestjs/mongoose';
import { TableSchema } from './tables.model';

export const TableModelModule = MongooseModule.forFeature([
  {
    name: 'table',
    schema: TableSchema,
  },
]);
