import { Types } from 'mongoose';

export interface HostSummary {
  id: Types.ObjectId;
  ip: string;
}
