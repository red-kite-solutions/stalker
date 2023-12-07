import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CompanyService } from '../../reporting/company.service';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('Cron Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let companyService: CompanyService;
  let subscriptionsService: CronSubscriptionsService;

  const csDto: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription',
    companyId: null,
    jobParameters: [{ name: 'domainName', value: 'example.com' }],
  };

  const csDto2: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription2',
    companyId: null,
    jobParameters: [{ name: 'domainName', value: 'example.ca' }],
  };

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
      await companyService.delete(c._id.toString());
    }
    const allSubs = await subscriptionsService.getAll();
    for (const s of allSubs) {
      await subscriptionsService.delete(s._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Cron subscriptions management', () => {
    it('Should create a cron subscription', async () => {
      // Arrange & Act
      const cs = await subscription(csDto);

      // Assert
      expect(cs.name).toStrictEqual(csDto.name);
    });

    it('Should update a cron subscription', async () => {
      // Arrange
      const cs = await subscription(csDto);

      // Act
      const newCs = await subscriptionsService.edit(cs._id.toString(), {
        ...csDto,
        name: csDto2.name,
      });
      const css = await subscriptionsService.getAll();

      // Assert
      expect(newCs.modifiedCount).toStrictEqual(1);
      expect(css[0].name).toStrictEqual(csDto2.name);
    });

    it('Should get all the cron subscriptions', async () => {
      // Arrange
      const cs = await subscription(csDto);
      const cs2 = await subscription(csDto2);

      // Act
      const subs = await subscriptionsService.getAll();

      // Assert
      expect(subs[0].name).toStrictEqual(cs.name);
      expect(subs[1].name).toStrictEqual(cs2.name);
    });

    it('Should delete the cron subscriptions for a company', async () => {
      // Arrange
      const cs = await subscription(csDto);
      const comp = await company('cs company');
      const csDto3: CronSubscriptionDto = {
        cronExpression: '*/5 * * * *',
        jobName: 'DomainNameResolvingJob',
        name: 'Test Cron Subscription3',
        companyId: comp._id.toString(),
        jobParameters: [{ name: 'domainName', value: 'example.io' }],
      };
      const cs3 = await subscription(csDto3);
      const cs2 = await subscription(csDto2);

      // Act
      await subscriptionsService.deleteAllForCompany(comp._id.toString());
      const subs = await subscriptionsService.getAll();

      // Assert
      expect(subs.length).toStrictEqual(2);
      expect(subs[0].name).toStrictEqual(cs.name);
      expect(subs[1].name).toStrictEqual(cs2.name);
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
