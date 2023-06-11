import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { CompanyDocument } from '../company.model';
import { CompanyService } from '../company.service';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

describe('Domain Service', () => {
  let moduleFixture: TestingModule;
  let hostService: DomainsService;
  let domainService: DomainsService;
  let companyService: CompanyService;
  let tagsService: TagsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    domainService = moduleFixture.get(DomainsService);
    companyService = moduleFixture.get(CompanyService);
    tagsService = moduleFixture.get(TagsService);
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
    const allTags = await tagsService.getAll();
    for (const t of allTags) {
      await tagsService.delete(t._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Add domains', () => {
    it('Should only return new domains', async () => {
      // Arrange
      const c = await companyService.addCompany({
        name: randomUUID(),
        imageType: null,
        logo: null,
      });
      await domainService.addDomains(['asdf.example.com'], c._id.toString());

      // Act
      const domains = await domainService.addDomains(
        ['asdf.example.com', 'asdf2.example.com'],
        c._id.toString(),
      );

      // Assert
      expect(domains.length).toBe(1);
    });
  });

  describe('Get all', () => {
    it('Filter by company', async () => {
      // Arrange
      const c1 = await company('my first company');
      const d1 = await domain('company5.example.org', c1);

      const c2 = await company('my second company');
      const d2 = await domain('company6.example.org', c1);

      const filter = domainService.buildFilters({
        domain: null,
        tags: null,
        company: c1._id.toString(),
        page: '0',
        pageSize: '10',
      });

      // Act
      const allDomains = await domainService.getAll(0, 10, filter);

      // Assert
      expect(allDomains.length).toBe(2);

      const d1Res = allDomains[0];
      expect(d1Res.companyId.toString()).toBe(c1._id.toString());
      expect(d1Res.name).toStrictEqual(d1.name);

      const d2Res = allDomains[1];
      expect(d2Res.companyId.toString()).toBe(c1._id.toString());
      expect(d2Res.name).toStrictEqual(d2.name);
    });

    it.each([
      [
        ['foo'],
        'foo.example.org',
        'bar.foo.company.example.org',
        'foo.bar.somethingelse.example.org',
      ],
      [
        ['foo', 'bar'],
        'bar.foo.company.example.org',
        'foo.bar.somethingelse.example.org',
      ],
    ])(
      'Filter by domain',
      async (domains: string[], ...expectedDomains: string[]) => {
        // Arrange
        const c1 = await company('c1');
        const c2 = await company('c2');

        const d1 = await domain('foo.example.org', c1);
        const d2 = await domain('bar.foo.company.example.org', c1);
        const d3 = await domain('foo.bar.somethingelse.example.org', c2);
        const d4 = await domain('unrelated.example.org', c2);
        const filter = domainService.buildFilters({
          domain: domains,
          tags: null,
          company: null,
          page: '0',
          pageSize: '10',
        });

        // Act
        const allDomains = await domainService.getAll(0, 10, filter);

        // Assert
        expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
          expectedDomains.sort(),
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
      const d2 = await domain('abc.company.example.org', c1);
      const d3 = await domain('xyz.example.org', c2);
      const d4 = await domain('unrelated.example.org', c2);

      await domainService.tagDomain(d1._id.toString(), t1._id.toString(), true);
      await domainService.tagDomain(d4._id.toString(), t1._id.toString(), true);
      await domainService.tagDomain(d2._id.toString(), t2._id.toString(), true);
      const filter = domainService.buildFilters({
        domain: null,
        tags: [t1._id.toString()],
        company: null,
        page: '0',
        pageSize: '10',
      });

      // Act
      const allDomains = await domainService.getAll(0, 10, filter);

      // Assert
      expect(allDomains.length).toStrictEqual(2);
      expect(allDomains.map((x) => x.name).sort()).toStrictEqual([
        d1.name,
        d4.name,
      ]);
    });
  });

  describe('Delete domains', () => {
    it('Delete domain by id', async () => {
      // Arrange
      const c1 = await company('my first company');
      const d1 = await domain('company6.example.org', c1);

      // Act
      const res = await domainService.delete(d1._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(1);
    });

    it('Delete multiple domains by id', async () => {
      // Arrange
      const c1 = await company('my first company');
      const d1 = await domain('company6.example.org', c1);
      const d2 = await domain('company7.example.org', c1);
      const d3 = await domain('company8.example.org', c1);

      // Act
      const res = await domainService.deleteMany([
        d1._id.toString(),
        d2._id.toString(),
        d3._id.toString(),
      ]);

      // Assert
      expect(res.deletedCount).toStrictEqual(3);
    });
  });

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
    return (
      await domainService.addDomains([domain], company._id)
    )[0] as DomainDocument;
  }
});
