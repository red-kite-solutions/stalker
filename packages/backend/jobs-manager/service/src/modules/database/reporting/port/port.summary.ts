import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Summary } from '../resource.summary';

export interface PortSummary extends Summary {
  port: number;
}

export class PortSummaryType implements PortSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  port: number;
}
