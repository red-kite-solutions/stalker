import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Summary } from '../resource.summary';

export class DomainSummary extends Summary {
  @ApiProperty({ example: 'example.com' })
  @Prop()
  name: string;
}
