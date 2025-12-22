import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CustomJobTemplateSummary {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category?: string;
}
