import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Program } from '../program.model';

export type ReportDocument = Report & Document;

@Schema()
export class Report {
    @Prop()
    public date: string;

    @Prop()
    public programs?: Program[];

    @Prop()
    public notes?: string[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);