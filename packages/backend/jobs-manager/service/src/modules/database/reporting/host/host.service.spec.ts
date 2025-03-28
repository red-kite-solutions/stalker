import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { Domain } from '../domain/domain.model';
import { DomainsService } from '../domain/domain.service';
import { ProjectDocument } from '../project.model';
import { ProjectService } from '../project.service';
import { HostService } from './host.service';

describe('Host Service', () => {
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
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Add hosts', () => {
    it('Should only return new hosts', async () => {
      // Arrange
      const c = await projectService.addProject({
        name: randomUUID(),
        imageType: null,
        logo: null,
      });
      const domains = await domain('project1.example.org', c);
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
      const c1 = await project('my-first-project');
      const c2 = await project('acme inc.');

      const d1 = await domain('project3.example.org', c1);
      const d2 = await domain('project4.example.org', c2);

      // Act
      await host(d1, c1, [], '8.8.8.8');
      await host(d2, c2, [], '8.8.8.8');

      // Assert
      const allHosts = await hostService.getAll(0, 10, null);
      const h1 = allHosts[0];
      expect(h1.projectId.toString()).toStrictEqual(c1._id.toString());
      expect(h1.ip).toBe('8.8.8.8');

      const h2 = allHosts[1];
      expect(h2.projectId.toString()).toStrictEqual(c2._id.toString());
      expect(h2.ip).toBe('8.8.8.8');
    });
  });

  describe('Get all', () => {
    it('Filter by project', async () => {
      // Arrange
      const c1 = await project('my first project');
      const d1 = await domain('project5.example.org', c1);

      const c2 = await project('my second project');
      const d2 = await domain('project6.example.org', c2);

      await host(d1, c1, [], '8.8.8.8', '1.2.3.4');
      await host(d2, c2, [], '2.3.4.5', '6.7.8.9');

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        projects: [c1.id],
      });

      // Assert
      expect(allHosts.length).toBe(2);

      const h1 = allHosts[0];
      expect(h1.projectId.toString()).toBe(c1._id.toString());
      expect(h1.ip).toBe('8.8.8.8');

      const h2 = allHosts[1];
      expect(h2.projectId.toString()).toBe(c1._id.toString());
      expect(h2.ip).toBe('1.2.3.4');
    });

    it.each([
      [['foo'], '1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4', '5.5.5.5'],
      [['foo', 'bar'], '1.1.1.1', '3.3.3.3', '4.4.4.4', '5.5.5.5'],
    ])(
      'Filter by domain',
      async (domains: string[], ...expectedIps: string[]) => {
        // Arrange
        const c1 = await project('c1');
        const c2 = await project('c2');

        const d1 = await domain('foo.example.org', c1);
        await host(d1, c1, [], '1.1.1.1', '2.2.2.2');

        const d2 = await domain('bar.foo.project.example.org', c1);
        await host(d2, c1, [], '1.1.1.1', '3.3.3.3');

        const d3 = await domain('foo.bar.somethingelse.example.org', c2);
        await host(d3, c2, [], '4.4.4.4', '5.5.5.5');

        const d4 = await domain('unrelated.example.org', c2);
        await host(d4, c2, [], '6.6.6.6');

        // Act
        const allHosts = await hostService.getAll(0, 10, {
          domains: domains,
        });

        // Assert
        expect(allHosts.map((x) => x.ip).sort()).toStrictEqual(
          expectedIps.sort(),
        );
      },
    );

    it.each([
      [['159'], '1.1.159.1', '6.6.159.6'],
      [['1.1.159.1'], '1.1.159.1'],
      [['  1.1.159.1  '], '1.1.159.1'],
      [['2.2.2.2', '6.6.159.6'], '2.2.2.2', '6.6.159.6'],
    ])('Filter by host', async (hosts: string[], ...expectedIps: string[]) => {
      // Arrange
      const c1 = await project('c1');
      const c2 = await project('c2');

      const d1 = await domain('foo.example.org', c1);
      await host(d1, c1, [], '1.1.159.1', '2.2.2.2');

      const d2 = await domain('bar.foo.project.example.org', c1);
      await host(d2, c1, [], '1.1.159.1', '3.3.3.3');

      const d3 = await domain('foo.bar.somethingelse.example.org', c2);
      await host(d3, c2, [], '4.4.4.4', '5.5.5.5');

      const d4 = await domain('unrelated.example.org', c2);
      await host(d4, c2, [], '6.6.159.6');

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        hosts: hosts,
      });

      // Assert
      expect(allHosts.map((x) => x.ip).sort()).toStrictEqual(
        expectedIps.sort(),
      );
    });

    it.each([
      {
        ranges: ['1.1.1.1/16', '4.4.4.4/32'],
        expectedIps: ['1.1.159.1', '4.4.4.4'],
      },
      {
        ranges: ['0.0.0.0/0'],
        expectedIps: [
          '1.1.159.1',
          '2.2.2.2',
          '3.3.3.3',
          '4.4.4.4',
          '5.5.5.5',
          '6.6.159.6',
        ],
      },
      {
        ranges: ['5.0.0.1/8'],
        expectedIps: ['5.5.5.5'],
      },
    ])('Filter by ip range', async ({ ranges, expectedIps }) => {
      // Arrange
      const c1 = await project('c1');
      const c2 = await project('c2');

      const d1 = await domain('foo.example.org', c1);
      await host(d1, c1, [], '1.1.159.1', '2.2.2.2');

      const d2 = await domain('bar.foo.project.example.org', c1);
      await host(d2, c1, [], '1.1.159.1', '3.3.3.3');

      const d3 = await domain('foo.bar.somethingelse.example.org', c2);
      await host(d3, c2, [], '4.4.4.4', '5.5.5.5');

      const d4 = await domain('unrelated.example.org', c2);
      await host(d4, c2, [], '6.6.159.6');

      // Act
      const allHosts = await hostService.getAll(0, 10, { ranges });

      // Assert
      expect(allHosts.map((x) => x.ip).sort()).toStrictEqual(
        expectedIps.sort(),
      );
    });

    it('Filter by tag', async () => {
      // Arrange
      const c1 = await project('c1');
      const c2 = await project('c2');

      const t1 = await tag('t1');
      const t2 = await tag('t2');

      const d1 = await domain('abc.example.org', c1);
      await host(d1, c1, [t1._id.toString()], '1.1.1.1', '2.2.2.2');

      const d2 = await domain('abc.project.example.org', c1);
      await host(d2, c1, [t1._id.toString()], '1.1.1.1', '3.3.3.3');

      const d3 = await domain('xyz.example.org', c2);
      await host(d3, c2, [t2._id.toString()], '4.4.4.4', '5.5.5.5');

      const d4 = await domain('unrelated.example.org', c2);
      await host(d4, c2, [], '6.6.6.6');

      // Act
      const allHosts = await hostService.getAll(0, 10, {
        tags: [t1._id.toString()],
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

  describe('Delete hosts', () => {
    it('Delete host by id', async () => {
      // Arrange
      const c1 = await project('my first project');
      const d2 = await domain('project6.example.org', c1);

      const h = await host(d2, c1, [], '2.3.4.5');

      // Act
      const res = await hostService.delete(h[0]._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(1);
    });

    it('Delete multiple hosts by id', async () => {
      // Arrange
      const c1 = await project('my first project');
      const d2 = await domain('project6.example.org', c1);

      const h = await host(d2, c1, [], '2.3.4.5', '1.1.1.1', '3.3.3.3');

      // Act
      const res = await hostService.deleteMany([
        h[0]._id.toString(),
        h[1]._id.toString(),
        h[2]._id.toString(),
      ]);

      // Assert
      expect(res.deletedCount).toStrictEqual(3);
    });
  });

  async function host(
    domain: Domain,
    project: ProjectDocument,
    tags: string[],
    ...ips: string[]
  ) {
    return await hostService.addHostsWithDomain(
      ips,
      domain.name,
      project._id.toString(),
      tags,
    );
  }

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
    return (await domainService.addDomains([domain], project._id))[0] as Domain;
  }
});
