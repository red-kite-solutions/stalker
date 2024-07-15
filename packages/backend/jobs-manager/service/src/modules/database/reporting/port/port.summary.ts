import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export interface PortSummary {
  id: Types.ObjectId;
  port: number;
}

export class PortSummaryType implements PortSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  port: number;
}
