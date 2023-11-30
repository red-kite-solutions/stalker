import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('SubscriptionsService', () => {
  let subscriptionService: CronSubscriptionsService;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    subscriptionService = moduleFixture.get(CronSubscriptionsService);
    // const module: TestingModule = await Test.createTestingModule({
    //   providers: [CronSubscriptionsService],
    // }).compile();

    // subscriptionService = module.get<CronSubscriptionsService>(
    //   CronSubscriptionsService,
    // );
  });

  // Here are timestamp (ms) examples of a check every 10 seconds
  // for a cron that should start every 30 seconds
  //          */30 * * * * ?
  //
  // - 3000 --- 1701305970000
  // - 2000 --- 1701305980000
  // - 1000 --- 1701305990000
  // -  1   --- 1701305999999   prev() --> 1701305970000, next() --> 1701306000000
  //    0   --- 1701306000000   prev() --> 1701305970000, next() --> 1701306030000
  // +  1   --- 1701306000001   prev() --> 1701306000000, next() --> 1701306030000
  // + 1000 --- 1701306010000
  // + 2000 --- 1701306020000
  // + 3000 --- 1701306030000

  it('Should not run with an exact clock hit -1ms', () => {
    // Arrange
    const cronExpression = '*/30 * * * * ?';
    const lastRunTime = 1701305990000;
    const startTime = 1701305999999;

    //Act
    const result = subscriptionService.cronShouldRun(
      cronExpression,
      lastRunTime,
      startTime,
    );

    //Assert
    expect(result).toStrictEqual(false);
  });

  it('Should not run with an exact clock hit, but run on the next pass', () => {
    // Arrange
    const cronExpression = '*/30 * * * * ?';
    let lastRunTime = 1701305990000;
    let startTime = 1701306000000;

    //Act
    let result = subscriptionService.cronShouldRun(
      cronExpression,
      lastRunTime,
      startTime,
    );

    //Assert
    expect(result).toStrictEqual(false);

    // Arrange
    lastRunTime = startTime;
    startTime = 1701306010000;

    //Act
    result = subscriptionService.cronShouldRun(
      cronExpression,
      lastRunTime,
      startTime,
    );

    //Assert
    expect(result).toStrictEqual(true);
  });

  it('Should run with an exact clock hit +1ms', () => {
    // Arrange
    const cronExpression = '*/30 * * * * ?';
    const lastRunTime = 1701305990000;
    const startTime = 1701306000001;

    //Act
    const result = subscriptionService.cronShouldRun(
      cronExpression,
      lastRunTime,
      startTime,
    );

    //Assert
    expect(result).toStrictEqual(true);
  });
});
