import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Summary } from '../resource.summary';

export class HostSummary extends Summary {
  @ApiProperty({ example: '1.1.1.1' })
  @Prop()
  ip: string;
}
