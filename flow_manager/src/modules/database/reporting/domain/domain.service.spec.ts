import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { HostService } from '../host/host.service';
import { ProjectDocument } from '../project.model';
import { ProjectService } from '../project.service';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

describe('Domain Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    domainService = moduleFixture.get(DomainsService);
    projectService = moduleFixture.get(ProjectService);
    tagsService = moduleFixture.get(TagsService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
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
      const c = await projectService.addProject({
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
    it('Filter by project', async () => {
      // Arrange
      const c1 = await project('my first project');
      const d1 = await domain('project5.example.org', c1);

      const c2 = await project('my second project');
      const d2 = await domain('project6.example.org', c1);

      // Act
      const allDomains = await domainService.getAll(0, 10, {
        domain: null,
        tags: null,
        host: null,
        project: c1._id.toString(),
        page: 0,
        pageSize: 10,
        firstSeenStartDate: undefined,
        firstSeenEndDate: undefined,
      });

      // Assert
      expect(allDomains.length).toBe(2);

      const d1Res = allDomains[0];
      expect(d1Res.projectId.toString()).toBe(c1._id.toString());
      expect(d1Res.name).toStrictEqual(d1.name);

      const d2Res = allDomains[1];
      expect(d2Res.projectId.toString()).toBe(c1._id.toString());
      expect(d2Res.name).toStrictEqual(d2.name);
    });

    it.each([
      [
        ['foo'],
        'foo.example.org',
        'bar.foo.project.example.org',
        'foo.bar.somethingelse.example.org',
      ],
      [
        ['foo', 'bar'],
        'bar.foo.project.example.org',
        'foo.bar.somethingelse.example.org',
      ],
    ])(
      'Filter by domain',
      async (domains: string[], ...expectedDomains: string[]) => {
        // Arrange
        const c1 = await project('c1');
        const c2 = await project('c2');

        const d1 = await domain('foo.example.org', c1);
        const d2 = await domain('bar.foo.project.example.org', c1);
        const d3 = await domain('foo.bar.somethingelse.example.org', c2);
        const d4 = await domain('unrelated.example.org', c2);

        // Act
        const allDomains = await domainService.getAll(0, 10, {
          domain: domains,
          tags: null,
          project: null,
          host: null,
          page: 0,
          pageSize: 10,
          firstSeenStartDate: undefined,
          firstSeenEndDate: undefined,
        });

        // Assert
        expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
          expectedDomains.sort(),
        );
      },
    );

    it.each([
      [
        ['159'],
        'foo.example.org',
        'bar.example.org',
        'bar.foo.project.example.org',
      ],
      [['1.1.159.1'], 'foo.example.org', 'bar.example.org'],
      [['  1.1.159.1  '], 'foo.example.org', 'bar.example.org'],
    ])(
      'Filter by host %s',
      async (hosts: string[], ...expectedDomains: string[]) => {
        // Arrange
        const c1 = await project('c1');
        const c2 = await project('c2');

        await domain('foo.example.org', c1);
        await host('1.1.159.1', 'foo.example.org', c1);
        await host('2.2.2.2', 'foo.example.org', c1);

        await domain('bar.example.org', c1);
        await host('1.1.159.1', 'bar.example.org', c1);

        await domain('bar.foo.project.example.org', c2);
        await host('6.6.159.6', 'bar.foo.project.example.org', c2);

        await domain('unrelated.example.org', c2);

        // Act
        const allDomains = await domainService.getAll(0, 10, {
          domain: null,
          tags: null,
          project: null,
          host: hosts,
          page: 0,
          pageSize: 10,
          firstSeenStartDate: undefined,
          firstSeenEndDate: undefined,
        });

        // Assert
        expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
          expectedDomains.sort(),
        );
      },
    );

    it('Filter by tag', async () => {
      // Arrange
      const c1 = await project('c1');
      const c2 = await project('c2');

      const t1 = await tag('t1');
      const t2 = await tag('t2');

      const d1 = await domain('abc.example.org', c1);
      const d2 = await domain('abc.project.example.org', c1);
      const d3 = await domain('xyz.example.org', c2);
      const d4 = await domain('unrelated.example.org', c2);

      await domainService.tagDomain(d1._id.toString(), t1._id.toString(), true);
      await domainService.tagDomain(d4._id.toString(), t1._id.toString(), true);
      await domainService.tagDomain(d2._id.toString(), t2._id.toString(), true);

      // Act
      const allDomains = await domainService.getAll(0, 10, {
        domain: null,
        tags: [t1._id.toString()],
        project: null,
        host: null,
        page: 0,
        pageSize: 10,
        firstSeenStartDate: undefined,
        firstSeenEndDate: undefined,
      });

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
      const c1 = await project('my first project');
      const d1 = await domain('project6.example.org', c1);

      // Act
      const res = await domainService.delete(d1._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(1);
    });

    it('Delete multiple domains by id', async () => {
      // Arrange
      const c1 = await project('my first project');
      const d1 = await domain('project6.example.org', c1);
      const d2 = await domain('project7.example.org', c1);
      const d3 = await domain('project8.example.org', c1);

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

  async function project(name: string) {
    return await projectService.addProject({
      name: name,
      imageType: null,
      logo: null,
    });
  }

  async function domain(domain: string, project: ProjectDocument) {
    return (
      await domainService.addDomains([domain], project._id)
    )[0] as DomainDocument;
  }

  async function host(
    ip: string,
    domainName: string,
    project: ProjectDocument,
  ) {
    return await hostService.addHostsWithDomain([ip], domainName, project._id);
  }
});
