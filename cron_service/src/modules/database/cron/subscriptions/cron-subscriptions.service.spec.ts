import { Test, TestingModule } from '@nestjs/testing';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('SubscriptionsService', () => {
  let service: CronSubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronSubscriptionsService],
    }).compile();

    service = module.get<CronSubscriptionsService>(CronSubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
