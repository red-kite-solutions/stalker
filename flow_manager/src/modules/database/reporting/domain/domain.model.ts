import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DomainDocument = Domain & Document;

@Schema()
export class Domain {
    @Prop()
    public name!: string;

    @Prop()
    public isRawIp!: boolean;

    @Prop()
    public subdomains?: [Domain];

    @Prop()
    public ips?: [string];
}

export const DomainSchema = SchemaFactory.createForClass(Domain);