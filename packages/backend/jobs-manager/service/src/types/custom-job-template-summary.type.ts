import { Types } from 'mongoose';

export interface CustomJobTemplateSummary {
  _id: Types.ObjectId;
  name: string;
  templateOrdering?: string;
}
