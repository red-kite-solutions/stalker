import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { CompanyDocument } from '../company.model';
import { CompanyService } from '../company.service';
import { Domain } from '../domain/domain.model';
import { DomainsService } from '../domain/domain.service';
import { HostService } from './host.service';

describe('Host Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let companyService: CompanyService;
  let tagsService: TagsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
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

  describe('Add domains', () => {
    it('Should only return new hosts', async () => {
      // Arrange
      const c = await companyService.addCompany({
        name: randomUUID(),
        imageType: null,
        logo: null,
      });
      const domains = await domain('company1.example.org', c);
      const d = domains;

      // Act & Assert
      let newHosts = await host(d, c, [], '1.1.1.1');
      expect(newHosts.length).toBe(1);

      // Act & Assert
      newHosts = await host(d, c, [], '1.1.1.1');

      // Assert
      expect(newHosts.length).toBe(0);
    });

    it('Should support same ip for multiple hosts', async () => {
      // Arrange
      const c1 = await company('my-first-company');
      const c2 = await company('acme inc.');

      const d1 = await domain('company3.example.org', c1);
      const d2 = await domain('company4.example.org', c2);

      // Act
      await host(d1, c1, [], '8.8.8.8');
      await host(d2, c2, [], '8.8.8.8');

      // Assert
      const allHosts = await hostService.getAll(0, 10, null);
      const h1 = allHosts[0];
      expect(h1.companyId.toString()).toStrictEqual(c1._id.toString());
      expect(h1.ip).toBe('8.8.8.8');

      const h2 = allHosts[1];
      expect(h2.companyId.toString()).toStrictEqual(c2._id.toString());
      expect(h2.ip).toBe('8.8.8.8');
    });
  });

  describe('Get all', () => {
    it('Filter by company', async () => {
      // Arrange
      const c1 = await company('my first company');
      const d1 = await domain('company5.example.org', c1);

      const c2 = await company('my second company');
      const d2 = await domain('company6.example.org', c1);

      await host(d1, c1, [], '8.8.8.8', '1.2.3.4');
      await host(d2, c2, [], '2.3.4.5', '6.7.8.9');

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        company: [c1.name],
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

    it.each([
      [['foo'], '1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4', '5.5.5.5'],
      [['foo', 'bar'], '1.1.1.1', '3.3.3.3', '4.4.4.4', '5.5.5.5'],
    ])(
      'Filter by domain',
      async (domains: string[], ...expectedIps: string[]) => {
        // Arrange
        const c1 = await company('c1');
        const c2 = await company('c2');

        const d1 = await domain('foo.example.org', c1);
        await host(d1, c1, [], '1.1.1.1', '2.2.2.2');

        const d2 = await domain('bar.foo.company.example.org', c1);
        await host(d2, c1, [], '1.1.1.1', '3.3.3.3');

        const d3 = await domain('foo.bar.somethingelse.example.org', c2);
        await host(d3, c2, [], '4.4.4.4', '5.5.5.5');

        const d4 = await domain('unrelated.example.org', c2);
        await host(d4, c2, [], '6.6.6.6');

        // Act
        const allHosts = await hostService.getAll(0, 10, {
          domain: domains,
        });

        // Assert
        expect(allHosts.map((x) => x.ip).sort()).toStrictEqual(
          expectedIps.sort(),
        );
      },
    );

    it('Filter by tag', async () => {
      // Arrange
      const c1 = await company('c1');
      const c2 = await company('c2');

      const t1 = await tag('t1');
      const t2 = await tag('t2');

      const d1 = await domain('abc.example.org', c1);
      await host(d1, c1, [t1._id], '1.1.1.1', '2.2.2.2');

      const d2 = await domain('abc.company.example.org', c1);
      await host(d2, c1, [t1._id], '1.1.1.1', '3.3.3.3');

      const d3 = await domain('xyz.example.org', c2);
      await host(d3, c2, [t2._id], '4.4.4.4', '5.5.5.5');

      const d4 = await domain('unrelated.example.org', c2);
      await host(d4, c2, [], '6.6.6.6');

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        tags: [t1._id],
      });
      const allHosts2 = await hostService.getAll(0, 10, {});

      // Assert
      expect(allHosts.map((x) => x.ip).sort()).toStrictEqual([
        '1.1.1.1',
        '2.2.2.2',
        '3.3.3.3',
      ]);
    });
  });

  async function host(
    domain: Domain,
    company: CompanyDocument,
    tags: string[],
    ...ips: string[]
  ) {
    return await hostService.addHostsWithDomain(
      ips,
      domain.name,
      company._id.toString(),
      tags,
    );
  }

  async function tag(name: string) {
    return await tagsService.create(name, '#cccccc');
  }

  async function company(name: string) {
    return await companyService.addCompany({
      name: name,
      imageType: null,
      logo: null,
    });
  }

  async function domain(domain: string, company: CompanyDocument) {
    return (await domainService.addDomains([domain], company._id))[0] as Domain;
  }
});
