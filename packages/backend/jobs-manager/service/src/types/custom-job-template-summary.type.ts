import { Types } from 'mongoose';

export interface CustomJobTemplateSummary {
  _id: Types.ObjectId;
  name: string;
  category?: string;
}
