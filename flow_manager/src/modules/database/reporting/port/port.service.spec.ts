import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { CompanyService } from '../company.service';
import { DomainsService } from '../domain/domain.service';
import { PortService } from './port.service';

describe('Host Service', () => {
  let moduleFixture: TestingModule;
  let hostService: PortService;
  let domainService: DomainsService;
  let companyService: CompanyService;
  let tagsService: TagsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(PortService);
    domainService = moduleFixture.get(DomainsService);
    companyService = moduleFixture.get(CompanyService);
    tagsService = moduleFixture.get(TagsService);
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });
});
