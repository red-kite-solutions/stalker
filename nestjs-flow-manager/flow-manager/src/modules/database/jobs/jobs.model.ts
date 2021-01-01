import { getModelForClass, mongoose, prop, buildSchema } from '@typegoose/typegoose';

export class Job extends mongoose.Document {
    @prop()
    public task!: string;

    @prop()
    public program!: string;

    @prop()
    public priority!: number;

    @prop()
    public data!: object;

    @prop()
    public jobId!: string;
}

export const jobSchema = buildSchema(Job);