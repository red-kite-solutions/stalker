import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../../../app.module';
import { TagsDocument } from '../../tags/tag.model';
import { TagsService } from '../../tags/tag.service';
import { Domain, DomainDocument } from '../domain/domain.model';
import { DomainsService } from '../domain/domain.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectDocument } from '../project.model';
import { ProjectService } from '../project.service';
import { HostDocument } from './host.model';
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
    let project1: ProjectDocument;
    let project2: ProjectDocument;

    let domain1: DomainDocument;
    let domain2: DomainDocument;
    let domain3: DomainDocument;

    let foo: TagsDocument;
    let bar: TagsDocument;
    let baz: TagsDocument;
    let qux: TagsDocument;

    let h1: HostDocument;
    let h2: HostDocument;
    let h3: HostDocument;

    beforeEach(async () => {
      // Arrange
      project1 = await project('project 1');
      project2 = await project('project 2');
      [foo, bar, baz, qux] = await tags('foo', 'bar', 'baz', 'qux');

      domain1 = await domain('d1.example.org', project1);
      domain2 = await domain('d2.example.org', project1);
      domain3 = await domain('d3.example.org', project2);

      [h1, h2] = await host(domain1, project1, [foo.id], '1.1.1.1', '1.2.2.2');
      [h2] = await host(domain1, project1, [foo.id], '1.2.2.2');
      [h3] = await host(domain2, project2, [foo.id], '1.2.2.3');
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

      const [h1, h2, h3] = await host(
        d2,
        c1,
        [],
        '2.3.4.5',
        '1.1.1.1',
        '3.3.3.3',
      );

      // Act
      const res = await hostService.deleteMany([
        h1._id.toString(),
        h2._id.toString(),
        h3._id.toString(),
      ]);

      // Assert
      expect(res.deletedCount).toStrictEqual(3);
    });
  });

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name };
    return await projectService.addProject(ccDto);
  }

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

  async function tags(...tags: string[]) {
    const createdTags: TagsDocument[] = [];
    for (const tag of tags) {
      createdTags.push(await tagsService.create(tag, '#ffffff'));
    }

    return createdTags;
  }

  async function domain(domain: string, project: ProjectDocument) {
    return (await domainService.addDomains([domain], project._id))[0];
  }
});
