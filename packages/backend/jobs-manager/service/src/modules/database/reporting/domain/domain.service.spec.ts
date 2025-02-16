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
      expect(domains.length).toBe(2);
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

      d1 = await domain('d1', project1, [foo, bar]);
      d2 = await domain('d2', project1, [foo, baz]);
      d3 = await domain('d3', project2, [qux]);

      h1 = await host('1.1.1.1', d1.name, project1);
      h2 = await host('1.2.2.2', d2.name, project1);
      h3 = await host('1.2.2.3', d3.name, project2);

      await block(d3);
    });

    it.each([
      ['', ['d1', 'd2', 'd3']],

      // Projects
      ['project: "project*"', ['d1', 'd2', 'd3']],
      ['project: "project 1"', ['d1', 'd2']],
      ['project: "project 2"', ['d3']],
      ['-project: "project 2"', ['d1', 'd2']],
      ['project.name: "project*"', ['d1', 'd2', 'd3']],
      ['project.name: "project 1"', ['d1', 'd2']],
      ['project.name: "project 2"', ['d3']],
      ['-project.name: "project 2"', ['d1', 'd2']],
      [() => `project.id: ${project1.id}`, ['d1', 'd2']],
      [() => `project.id: ${project2.id}`, ['d3']],
      [() => `-project.id: ${project2.id}`, ['d1', 'd2']],

      // Host
      ['host: 1.1.1.1', ['d1']],
      ['host.ip: 1.1.1.1', ['d1']],
      [() => `host.id: ${h1._id}`, ['d1']],
      ['host: 1.*', ['d1', 'd2', 'd3']],
      ['host: 1.2.2*', ['d2', 'd3']],
      ['-host: 1.1.1.1', ['d2', 'd3']],
      ['-host.ip: 1.1.1.1', ['d2', 'd3']],
      [() => `-host.id: ${h1.id}`, ['d2', 'd3']],
      ['-host: 1.2.2*', ['d1']],

      // Tag
      ['tag: foo', ['d1', 'd2']],
      ['-tag: foo', ['d3']],
      [() => `tag.id: ${foo._id}`, ['d1', 'd2']],
      [() => `-tag.id: ${foo._id}`, ['d3']],
      ['-tag: ba*', ['d3']],
      ['tag: qux', ['d3']],
      ['tag: foo tag: bar', ['d1']],
      ['-tag: foo tag: qux', ['d3']],

      // Is
      ['is: blocked', ['d3']],
      ['-is: blocked', ['d1', 'd2']],
    ])(
      'Filter by "%s"',
      async (query: string | (() => string), expected: string[]) => {
        // Arrange
        if (typeof query !== 'string') query = query();

        // Act
        const domains = await domainService.getAll(0, 10, {
          query,
          page: 0,
          pageSize: 100,
        });

        // Assert
        expect(domains.map((x) => x.name).sort()).toStrictEqual(
          expected.sort(),
        );
      },
    );
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
    const foo = await hostService.addHostsWithDomain(
      [ip],
      domainName,
      project._id,
      tags.map((x) => x.id),
    );
    return foo[0];
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
