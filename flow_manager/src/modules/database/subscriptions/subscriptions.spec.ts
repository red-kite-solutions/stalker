import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { CompanyService } from '../reporting/company.service';
import { SubscriptionDto } from './subscriptions.dto';
import { SubscriptionsService } from './subscriptions.service';

describe('Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let companyService: CompanyService;
  let subscriptionsService: SubscriptionsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    companyService = moduleFixture.get(CompanyService);
    subscriptionsService = moduleFixture.get(SubscriptionsService);
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

  describe('Get subscriptions', () => {
    it('Should get only the subscriptions for the company', async () => {
      // Arrange
      const c1 = await company('sub-c1');
      const c2 = await company('sub-c2');
      const finding = 'HostnameFinding';
      const name = 'my special name';

      const subData: SubscriptionDto = {
        companyId: '',
        name: 'my sub',
        jobName: 'DomainNameResolvingJob',
        finding: finding,
      };

      const s1 = await subscription({
        ...subData,
        companyId: c1._id.toString(),
      });
      const s2 = await subscription({
        ...subData,
        companyId: c2._id.toString(),
        name: name,
      });

      // Act
      const subs = await subscriptionsService.getAllForFinding(
        c2._id.toString(),
        finding,
      );

      // Assert
      expect(subs.length).toStrictEqual(1);
      expect(subs[0].companyId).toStrictEqual(c2._id);
      expect(subs[0].name).toStrictEqual(name);
    });

    it('Should get only the subscriptions for the finding', async () => {
      // Arrange
      const c1 = await company('sub-c12');
      const c2 = await company('sub-c22');
      const finding = 'HostnameFinding';
      const finding2 = 'HostnameIpFinding';

      const subData: SubscriptionDto = {
        companyId: '',
        name: 'my sub',
        jobName: 'DomainNameResolvingJob',
        finding: finding,
      };

      const s1 = await subscription({
        ...subData,
        companyId: c1._id.toString(),
      });
      const s2 = await subscription({
        ...subData,
        companyId: c2._id.toString(),
        finding: finding2,
      });

      // Act
      const subs = await subscriptionsService.getAllForFinding(
        c2._id.toString(),
        finding2,
      );

      // Assert
      expect(subs.length).toStrictEqual(1);
      expect(subs[0].companyId).toStrictEqual(c2._id);
      expect(subs[0].finding).toStrictEqual(finding2);
    });
  });

  async function company(name: string) {
    return await companyService.addCompany({
      name: name,
      imageType: null,
      logo: null,
    });
  }
  async function subscription(subscription: SubscriptionDto) {
    return await subscriptionsService.create(subscription);
  }
});
