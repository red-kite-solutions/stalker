import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FindingType = 'image' | 'text';

export type FindingField = FindingImageField | FindingTextField;

export class FindingImageField {
  @ApiProperty()
  @Prop()
  public key: string;

  @ApiProperty()
  @Prop()
  public readonly type: FindingType & 'image' = 'image';

  @ApiProperty()
  @Prop()
  public data: string;
}

export class FindingTextField {
  @ApiProperty()
  @Prop()
  public key: string;

  @ApiProperty()
  @Prop()
  public readonly type: FindingType & 'text' = 'text';

  @ApiProperty()
  @Prop()
  public label?: string;

  @ApiProperty()
  @Prop()
  public data?: string;
}

/**
 * Represents a finding.
 */
@Schema()
export class CustomFinding {
  /**
   * A pseudo-unique key identifying the entity related to this finding.
   *
   * The key should be generated using the static methods found in CorrelationUtils.
   *
   * @see [CorrelationUtils](./correlation.utils.ts)
   */
  @ApiProperty()
  @Prop({ index: true })
  public correlationKey: string;

  @ApiProperty()
  @Prop()
  public created: Date;

  @ApiProperty()
  @Prop()
  public name: string;

  @ApiProperty()
  @Prop({ index: true })
  public key: string;

  @ApiProperty()
  @Prop({ index: true })
  public jobId: string;

  @ApiProperty()
  @Prop()
  public fields: FindingField[];
}

export const FindingSchema = SchemaFactory.createForClass(CustomFinding);
