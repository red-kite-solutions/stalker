import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Summary } from '../resource.summary';

export class PortSummary extends Summary {
  @ApiProperty({ example: 443 })
  @Prop()
  port: number;
}
