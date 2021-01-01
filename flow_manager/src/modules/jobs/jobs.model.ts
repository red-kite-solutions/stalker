import { getModelForClass, mongoose, prop } from '@typegoose/typegoose';

export class Job extends mongoose.Document {
  @prop()
  public task!: string;

  @prop()
  public priority!: number;

  @prop()
  public data!: object;

  @prop()
  public id!: string;
}

export const jobModel = getModelForClass(Job);