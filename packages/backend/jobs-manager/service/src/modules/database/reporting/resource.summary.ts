import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class Summary {
  @ApiProperty()
  @Prop()
  id: Types.ObjectId;
}
