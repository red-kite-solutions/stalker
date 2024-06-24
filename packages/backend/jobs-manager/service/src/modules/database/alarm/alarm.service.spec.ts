import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Alarm } from './alarm.model';
import { AlarmService } from './alarm.service';

describe('AlarmService', () => {
  let alarmService: AlarmService;
  let alarmModel: Model<Alarm>;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    alarmService = moduleFixture.get(AlarmService);
    alarmModel = moduleFixture.get<Model<Alarm>>(getModelToken('alarms'));
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  beforeEach(async () => {
    const alarms = await alarmService.getAll();
    for (const s of alarms) {
      await alarmService.delete(s._id.toString());
    }
  });

  it('Should be true', () => {
    expect(true).toStrictEqual(true);
  });
});
