import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FindingType = 'image' | 'text';

export type FindingField = FindingImageField | FindingTextField;

export class FindingImageField {
  @Prop()
  public key: string;

  @Prop()
  public readonly type: FindingType & 'image' = 'image';

  @Prop()
  public data: string;
}

export class FindingTextField {
  @Prop()
  public key: string;

  @Prop()
  public readonly type: FindingType & 'text' = 'text';

  @Prop()
  public label?: string;

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
  @Prop({ index: true })
  public correlationKey: string;

  @Prop()
  public created: Date;

  @Prop()
  public name: string;

  @Prop()
  public key: string;

  @Prop({ index: true })
  public jobId: string;

  @Prop()
  public fields: FindingField[];
}

export const FindingSchema = SchemaFactory.createForClass(CustomFinding);
