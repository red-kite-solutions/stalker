import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Summary } from '../resource.summary';

export interface HostSummary extends Summary {
  ip: string;
}

export class HostSummaryType implements HostSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  ip: string;
}
