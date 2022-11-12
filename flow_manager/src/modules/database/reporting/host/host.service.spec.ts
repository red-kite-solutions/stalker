import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Document } from 'mongoose';
import { AppModule } from '../../../app.module';
import { Company } from '../company.model';
import { CompanyService } from '../company.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from './host.service';

describe('Host Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let companyService: CompanyService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    domainService = moduleFixture.get(DomainsService);
    companyService = moduleFixture.get(CompanyService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Add domains', () => {
    it('Should only return new hosts', async () => {
      // Arrange
      const company = await companyService.addCompany({
        name: randomUUID(),
        imageType: null,
        logo: null,
      });
      const domains = await domainService.addDomains(
        ['company1.example.org'],
        company._id,
        company.name,
      );
      const domain = domains[0];
      // Act & Assert
      let newHosts = await hostService.addHostsWithDomain(
        ['1.1.1.1'],
        domain.name,
        company._id.toString(),
        company.name,
      );
      expect(newHosts.length).toBe(1);
      // Act & Assert
      newHosts = await hostService.addHostsWithDomain(
        ['1.1.1.1'],
        domain.name,
        company._id.toString(),
        company.name,
      );
      // Assert
      expect(newHosts.length).toBe(0);
    });

    it('Should support same ip for multiple hosts', async () => {
      // Arrange
      const c1 = await company();
      const c2 = await company();

      const d1 = await domain('company3.example.org', c1);
      const d2 = await domain('company4.example.org', c1);

      // Act
      await hostService.addHostsWithDomain(
        ['8.8.8.8'],
        d1.name,
        c1._id.toString(),
        c1.name,
      );
      await hostService.addHostsWithDomain(
        ['8.8.8.8'],
        d2.name,
        c2._id.toString(),
        c2.name,
      );

      // Assert
      const allHosts = await hostService.getAll(0, 10, null);
      const h1 = allHosts[1];
      expect(h1.companyId.toString()).toBe(c1._id.toString());
      expect(h1.ip).toBe('8.8.8.8');

      const h2 = allHosts[2];
      expect(h2.companyId.toString()).toBe(c2._id.toString());
      expect(h2.ip).toBe('8.8.8.8');
    });
  });

  describe('Get all', () => {
    it('Filter by company', async () => {
      // Arrange
      const c1 = await company();
      const d1 = await domain('company5.example.org', c1);

      const c2 = await company();
      const d2 = await domain('company6.example.org', c1);

      await hostService.addHostsWithDomain(
        ['8.8.8.8', '1.2.3.4'],
        d1.name,
        c1._id.toString(),
        c1.name,
      );

      await hostService.addHostsWithDomain(
        ['2.3.4.5', '6.7.8.9'],
        d2.name,
        c2._id.toString(),
        c2.name,
      );

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        company: c1._id,
      });

      // Assert
      expect(allHosts.length).toBe(2);

      const h1 = allHosts[0];
      expect(h1.companyId.toString()).toBe(c1._id.toString());
      expect(h1.ip).toBe('8.8.8.8');

      const h2 = allHosts[1];
      expect(h2.companyId.toString()).toBe(c1._id.toString());
      expect(h2.ip).toBe('1.2.3.4');
    });
  });

  async function company() {
    return await companyService.addCompany({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });
  }

  async function domain(domain: string, company: Company & Document) {
    return (
      await domainService.addDomains([domain], company._id, company.name)
    )[0];
  }
});
