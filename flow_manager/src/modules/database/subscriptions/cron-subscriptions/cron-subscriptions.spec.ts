import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CompanyService } from '../../reporting/company.service';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('Cron Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let companyService: CompanyService;
  let subscriptionsService: CronSubscriptionsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    companyService = moduleFixture.get(CompanyService);
    subscriptionsService = moduleFixture.get(CronSubscriptionsService);
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
    const allSubs = await subscriptionsService.getAll();
    for (const s of allSubs) {
      await subscriptionsService.delete(s._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Get cron subscriptions', () => {
    it('Should get only the cron subscriptions for the company', async () => {
      // Arrange

      // Act

      // Assert
      expect(1).toStrictEqual(1);
    });
  });

  async function company(name: string) {
    return await companyService.addCompany({
      name: name,
      imageType: null,
      logo: null,
    });
  }
  async function subscription(subscription: CronSubscriptionDto) {
    return await subscriptionsService.create(subscription);
  }
});
