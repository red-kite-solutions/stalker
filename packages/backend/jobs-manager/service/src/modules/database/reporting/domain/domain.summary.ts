import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export interface DomainSummary {
  id: Types.ObjectId;
  name: string;
}

export class DomainSummaryType implements DomainSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  name: string;
}
