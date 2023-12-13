import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CompanyService } from '../../reporting/company.service';
import { SubscriptionTriggersService } from './subscription-triggers.service';

describe('Subscriptions Triggers Service', () => {
  let moduleFixture: TestingModule;
  let companyService: CompanyService;
  let subscriptionsService: SubscriptionTriggersService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    companyService = moduleFixture.get(CompanyService);
    subscriptionsService = moduleFixture.get(SubscriptionTriggersService);
  });

  beforeEach(async () => {
    // const allCompanies = await companyService.getAll();
    // for (const c of allCompanies) {
    //   await companyService.delete(c._id);
    // }
    // const allSubs = await subscriptionsService.getAll();
    // for (const s of allSubs) {
    //   await subscriptionsService.delete(s._id.toString());
    // }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  // async function company(name: string) {
  //   return await companyService.addCompany({
  //     name: name,
  //     imageType: null,
  //     logo: null,
  //   });
  // }
  // async function subscription(subscription: EventSubscriptionDto) {
  //   return await subscriptionsService.create(subscription);
  // }
});
