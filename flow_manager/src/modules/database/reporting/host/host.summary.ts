import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export interface HostSummary {
  id: Types.ObjectId;
  ip: string;
}

export class HostSummaryType implements HostSummary {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  ip: string;
}
