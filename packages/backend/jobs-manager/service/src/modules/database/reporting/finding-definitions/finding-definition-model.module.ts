import { MongooseModule } from '@nestjs/mongoose';
import { FindingDefinitionSchema } from './finding-definition.model';

export const FindingDefinitionsModelModule = MongooseModule.forFeature([
  {
    name: 'findingdefinition',
    schema: FindingDefinitionSchema,
  },
]);
