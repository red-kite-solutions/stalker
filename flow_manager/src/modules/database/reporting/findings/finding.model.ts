import { Prop, SchemaFactory } from '@nestjs/mongoose';

export type FindingType = 'image' | 'data';

export type FindingField = FindingImageField | FindingTextField;

export class FindingImageField {
  @Prop()
  public readonly type = 'image';

  @Prop()
  public data: string;
}

export class FindingTextField {
  @Prop()
  public readonly type = 'text';

  @Prop()
  public label: string;

  @Prop()
  public content: string;
}

/**
 * Represents a finding.
 */
export class Finding {
  @Prop({ index: true })
  public target: string;

  @Prop()
  public targetName: string;

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

export const FindingSchema = SchemaFactory.createForClass(Finding);
