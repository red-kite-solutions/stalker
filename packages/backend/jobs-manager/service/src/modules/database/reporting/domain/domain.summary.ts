import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Summary } from '../resource.summary';

export interface DomainSummary extends Summary {
  name: string;
}

export class DomainSummaryType implements DomainSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  name: string;
}
