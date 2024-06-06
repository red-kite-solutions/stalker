import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alarm, AlarmDocument } from './alarm.model';

@Injectable()
export class AlarmService {
  constructor(
    @InjectModel('alarms')
    private readonly alarmModel: Model<Alarm>,
  ) {}

  public async getAll(): Promise<AlarmDocument[]> {
    return await this.alarmModel.find({});
  }

  public async get(id: string): Promise<AlarmDocument | null> {
    return await this.alarmModel.findById(id);
  }

  public async create(
    name: string,
    cronExpression: string,
    enabled: boolean,
    path: string,
  ): Promise<AlarmDocument> {
    return await this.alarmModel.create({
      name: name,
      cronExpression: cronExpression,
      enabled: enabled,
      path: path,
    });
  }

  public async delete(id: string) {
    return this.alarmModel.deleteOne({ _id: { $eq: new Types.ObjectId(id) } });
  }
}
