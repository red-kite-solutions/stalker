import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsDocument } from '../../tags/tag.model';
import { TagsService } from '../../tags/tag.service';
import { HostDocument } from '../host/host.model';
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
    let project1: ProjectDocument;
    let project2: ProjectDocument;

    let foo: TagsDocument;
    let bar: TagsDocument;
    let baz: TagsDocument;
    let qux: TagsDocument;

    let h1: HostDocument;
    let h2: HostDocument;
    let h3: HostDocument;

    let d1: DomainDocument;
    let d2: DomainDocument;
    let d3: DomainDocument;

    beforeEach(async () => {
      // Arrange
      project1 = await project('project 1');
      project2 = await project('project 2');
      [foo, bar, baz, qux] = await tags('foo', 'bar', 'baz', 'qux');

      d1 = await domain('d1.org', project1);
      d2 = await domain('d2.org', project1);
      d3 = await domain('d3.org', project2);

      h1 = await host('1.1.1.1', d1.name, project1);
      h2 = await host('1.2.2.2', d2.name, project1);
      h3 = await host('1.2.2.3', d3.name, project2);

      block();
    });

    it.each([
      ['', ['d1.org', 'd2.org', 'd3.org']],

      // Projects
      ['project: "project*"', ['d1.org', 'd2.org', 'd3.org']],
      ['project: "project 1"', ['d1.org', 'd2.org']],
      ['project: "project 2"', ['d3.org']],
      ['-project: "project 2"', ['d1.org', 'd2.org']],
      ['project.name: "project*"', ['d1.org', 'd2.org', 'd3.org']],
      ['project.name: "project 1"', ['d1.org', 'd2.org']],
      ['project.name: "project 2"', ['d3.org']],
      ['-project.name: "project 2"', ['d1.org', 'd2.org']],
      [() => `project.id: ${project1.id}`, ['d1.org', 'd2.org']],
      [() => `project.id: ${project2.id}`, ['d3.org']],
      [() => `-project.id: ${project2.id}`, ['d1.org', 'd2.org']],

      // Host
      ['host: 1.1.1.1', ['d1.org']],
      ['host.ip: 1.1.1.1', ['d1.org']],
      [() => `host.id: ${h1._id}`, ['d1.org']],
      ['host: 1.*', ['d1.org']],
      ['host: 1.2.2*', ['d1.org', 'd2.org', 'd3.org']],
      ['-host: 1.1.1.1', ['d2.org', 'd3.org']],
      ['-host.ip: 1.1.1.1', ['d2.org', 'd3.org']],
      [() => `-host.id: ${h1.id}`, ['d2.org', 'd3.org']],
      ['-host: 1.2.2*', ['d2.org', 'd3.org']],

      // // Tag
      // ['tag: foo', [1, 2]],
      // [() => `tag.id: ${foo._id}`, [1, 2]],
      // [() => `-tag.id: ${foo._id}`, [3, 4, 5, 6]],
      // ['-tag: ba*', [1, 2]],
      // ['-tag: foo', [3, 4, 5, 6]],
      // ['tag: qux', [1, 2, 3, 4, 5, 6]],
      // ['tag: foo tag: qux', [1, 2]],
      // ['-tag: foo tag: qux', [3, 4, 5, 6]],

      // // Is
      // ['is: blocked', [6]],
      // ['-is: blocked', [1, 2, 3, 4, 5]],
    ])(
      'Filter by "%s"',
      async (query: string | (() => string), expected: string[]) => {
        // Arrange
        if (typeof query !== 'string') query = query();

        // Act
        const allDomains = await domainService.getAll(0, 10, {
          query,
          page: 0,
          pageSize: 100,
        });

        // Assert
        expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
          expected.sort(),
        );
      },
    );
  });

  // // describe('Get all', () => {
  // //   it('Filter by project', async () => {
  // //     // Arrange
  // //     const c1 = await project('my first project');
  // //     const d1 = await domain('project5.example.org', c1);

  // //     const c2 = await project('my second project');
  // //     const d2 = await domain('project6.example.org', c1);

  // //     // Act
  // //     const allDomains = await domainService.getAll(0, 10, {
  // //       domains: null,
  // //       tags: null,
  // //       hosts: null,
  // //       projects: [c1._id.toString()],
  // //       page: 0,
  // //       pageSize: 10,
  // //       firstSeenStartDate: undefined,
  // //       firstSeenEndDate: undefined,
  // //       blocked: undefined,
  // //     });

  // //     // Assert
  // //     expect(allDomains.length).toBe(2);

  // //     const d1Res = allDomains[0];
  // //     expect(d1Res.projectId.toString()).toBe(c1._id.toString());
  // //     expect(d1Res.name).toStrictEqual(d1.name);

  // //     const d2Res = allDomains[1];
  // //     expect(d2Res.projectId.toString()).toBe(c1._id.toString());
  // //     expect(d2Res.name).toStrictEqual(d2.name);
  // //   });

  // //   it.each([
  // //     [
  // //       ['foo'],
  // //       'foo.example.org',
  // //       'bar.foo.project.example.org',
  // //       'foo.bar.somethingelse.example.org',
  // //     ],
  // //     [
  // //       ['foo', 'bar'],
  // //       'bar.foo.project.example.org',
  // //       'foo.bar.somethingelse.example.org',
  // //     ],
  // //   ])(
  // //     'Filter by domain',
  // //     async (domains: string[], ...expectedDomains: string[]) => {
  // //       // Arrange
  // //       const c1 = await project('c1');
  // //       const c2 = await project('c2');

  // //       const d1 = await domain('foo.example.org', c1);
  // //       const d2 = await domain('bar.foo.project.example.org', c1);
  // //       const d3 = await domain('foo.bar.somethingelse.example.org', c2);
  // //       const d4 = await domain('unrelated.example.org', c2);

  // //       // Act
  // //       const allDomains = await domainService.getAll(0, 10, {
  // //         domains: domains,
  // //         tags: null,
  // //         projects: null,
  // //         hosts: null,
  // //         page: 0,
  // //         pageSize: 10,
  // //         firstSeenStartDate: undefined,
  // //         firstSeenEndDate: undefined,
  // //         blocked: undefined,
  // //       });

  // //       // Assert
  // //       expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
  // //         expectedDomains.sort(),
  // //       );
  // //     },
  // //   );

  // //   it.each([
  // //     [
  // //       ['159'],
  // //       'foo.example.org',
  // //       'bar.example.org',
  // //       'bar.foo.project.example.org',
  // //     ],
  // //     [['1.1.159.1'], 'foo.example.org', 'bar.example.org'],
  // //     [['  1.1.159.1  '], 'foo.example.org', 'bar.example.org'],
  // //   ])(
  // //     'Filter by host %s',
  // //     async (hosts: string[], ...expectedDomains: string[]) => {
  // //       // Arrange
  // //       const c1 = await project('c1');
  // //       const c2 = await project('c2');

  // //       await domain('foo.example.org', c1);
  // //       await host('1.1.159.1', 'foo.example.org', c1);
  // //       await host('2.2.2.2', 'foo.example.org', c1);

  // //       await domain('bar.example.org', c1);
  // //       await host('1.1.159.1', 'bar.example.org', c1);

  // //       await domain('bar.foo.project.example.org', c2);
  // //       await host('6.6.159.6', 'bar.foo.project.example.org', c2);

  // //       await domain('unrelated.example.org', c2);

  // //       // Act
  // //       const allDomains = await domainService.getAll(0, 10, {
  // //         domains: null,
  // //         tags: null,
  // //         projects: null,
  // //         hosts: hosts,
  // //         page: 0,
  // //         pageSize: 10,
  // //         firstSeenStartDate: undefined,
  // //         firstSeenEndDate: undefined,
  // //         blocked: undefined,
  // //       });

  // //       // Assert
  // //       expect(allDomains.map((x) => x.name).sort()).toStrictEqual(
  // //         expectedDomains.sort(),
  // //       );
  // //     },
  // //   );

  // //   it('Filter by tag', async () => {
  // //     // Arrange
  // //     const c1 = await project('c1');
  // //     const c2 = await project('c2');

  // //     const t1 = await tag('t1');
  // //     const t2 = await tag('t2');

  // //     const d1 = await domain('abc.example.org', c1);
  // //     const d2 = await domain('abc.project.example.org', c1);
  // //     const d3 = await domain('xyz.example.org', c2);
  // //     const d4 = await domain('unrelated.example.org', c2);

  // //     await domainService.tagDomain(d1._id.toString(), t1._id.toString(), true);
  // //     await domainService.tagDomain(d4._id.toString(), t1._id.toString(), true);
  // //     await domainService.tagDomain(d2._id.toString(), t2._id.toString(), true);

  // //     // Act
  // //     const allDomains = await domainService.getAll(0, 10, {
  // //       domains: null,
  // //       tags: [t1._id.toString()],
  // //       projects: null,
  // //       hosts: null,
  // //       page: 0,
  // //       pageSize: 10,
  // //       firstSeenStartDate: undefined,
  // //       firstSeenEndDate: undefined,
  // //       blocked: undefined,
  // //     });

  // //     // Assert
  // //     expect(allDomains.length).toStrictEqual(2);
  // //     expect(allDomains.map((x) => x.name).sort()).toStrictEqual([
  // //       d1.name,
  // //       d4.name,
  // //     ]);
  // //   });
  // // });

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

  async function domain(
    domain: string,
    project: ProjectDocument,
    tags: TagsDocument[] = [],
  ) {
    const d = (
      await domainService.addDomains([domain], project._id)
    )[0] as DomainDocument;

    for (const tag of tags) {
      await domainService.tagDomain(d.id, tag.id, true);
    }

    return d;
  }

  async function host(
    ip: string,
    domainName: string,
    project: ProjectDocument,
    tags: TagsDocument[] = [],
  ) {
    return await hostService.addHostsWithDomain(
      [ip],
      domainName,
      project._id,
      tags.map((x) => x.id),
    )[0];
  }

  async function tags(...tags: string[]) {
    const createdTags: TagsDocument[] = [];
    for (const tag of tags) {
      createdTags.push(await tagsService.create(tag, '#ffffff'));
    }

    return createdTags;
  }

  async function block(...domains: DomainDocument[]) {
    await domainService.batchEdit({
      block: true,
      domainIds: domains.map((x) => x.id),
    });
  }
});
