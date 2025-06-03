import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectService } from '../project.service';

import { TagsDocument } from '../../tags/tag.model';
import { Domain, DomainDocument } from '../domain/domain.model';
import { HostDocument } from '../host/host.model';
import { PortDocument } from '../port/port.model';
import { PortService } from '../port/port.service';
import { ProjectDocument } from '../project.model';
import { WebsiteDocument } from './website.model';
import { WebsiteService } from './website.service';

describe('Website Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let portService: PortService;
  let websiteService: WebsiteService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    domainService = moduleFixture.get(DomainsService);
    projectService = moduleFixture.get(ProjectService);
    tagsService = moduleFixture.get(TagsService);
    portService = moduleFixture.get(PortService);
    websiteService = moduleFixture.get(WebsiteService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
    const tags = await tagsService.getAll();
    for (const t of tags) {
      tagsService.delete(t._id);
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Add websites', () => {
    it('Should create a website for a host without domain or path', async () => {
      // Arrange
      const portNumber = 22;
      const c = await project();
      const h = await host('1.1.1.1', c);
      const p = await port(portNumber, h);

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(w1.path).toStrictEqual('/');
      expect(w1.domain).toBeNull();
    });

    it('Should create a website for a host with domain without path', async () => {
      // Arrange
      const portNumber = 22;
      const domainName = 'example.com';
      const c = await project();
      const h = await host('1.1.1.1', c);
      const p = await port(portNumber, h);
      const d = await domain(domainName, c);

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
        domainName,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(w1.path).toStrictEqual('/');
      expect(w1.domain.name).toStrictEqual(domainName);
    });

    it('Should create a website for a host with domain and path', async () => {
      // Arrange
      const portNumber = 22;
      const domainName = 'example.com';
      const path = '/example/asdf/';
      const c = await project();
      const h = await host('1.1.1.1', c);
      const p = await port(portNumber, h);
      const d = await domain(domainName, c);

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
        domainName,
        path,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(w1.path).toStrictEqual(path);
      expect(w1.domain.name).toStrictEqual(domainName);
    });

    it('Should create a website for a host without domain, but with path', async () => {
      // Arrange
      const portNumber = 22;
      const path = '/example/asdf/';
      const c = await project();
      const h = await host('1.1.1.1', c);
      const p = await port(portNumber, h);

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
        '',
        path,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(w1.path).toStrictEqual(path);
      expect(w1.domain).toBeNull();
    });

    it('Should not create a second website for twice the same host-port-domain-project', async () => {
      // Arrange
      const portNumber = 22;
      const path = '/example/asdf/';
      const domainName = 'example.com';
      const c = await project();
      const h = await host('1.1.1.1', c);
      const p = await port(portNumber, h);
      const d = await domain(domainName, c);
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
        domainName,
        path,
      );

      // Act
      const w2 = await websiteService.addWebsite(
        c._id.toString(),
        h.ip,
        portNumber,
        domainName,
        path,
      );

      // Assert
      const allWebsites = await websiteService.getAll();
      expect(allWebsites.length).toStrictEqual(1);
      expect(allWebsites[0]._id.toString()).toStrictEqual(w1._id.toString());
    });
  });

  describe('Get all', () => {
    let project1: ProjectDocument;
    let project2: ProjectDocument;

    let domain1: DomainDocument;
    let domain2: DomainDocument;

    let foo: TagsDocument;
    let bar: TagsDocument;
    let baz: TagsDocument;

    let host1: HostDocument;
    let host2: HostDocument;

    let port1: PortDocument;
    let port2: PortDocument;
    let port3: PortDocument;

    let website1: WebsiteDocument;
    let website2: WebsiteDocument;
    let website3: WebsiteDocument;

    beforeEach(async () => {
      // Arrange
      project1 = await project('project 1');
      project2 = await project('project 2');
      [foo, bar, baz] = await tags('foo', 'bar', 'baz');

      domain1 = await domain('d1', project1);
      domain2 = await domain('d2', project2);

      [host1, host2] = await hostForDomain(
        domain1,
        [foo],
        '1.1.1.1',
        '1.2.2.2',
      );
      [host2] = await hostForDomain(domain2, [foo, bar], '1.2.2.2');

      port1 = await port(80, host1, 'tcp');
      port2 = await port(80, host1, 'tcp');
      port3 = await port(443, host2, 'tcp');

      website1 = await website('website1', domain1, host1, port1, [foo]);
      website2 = await website('website2', domain1, host1, port2, [foo, bar]);
      website3 = await website(
        'website3',
        domain2,
        host2,
        port3,
        [bar, baz],
        true,
      );

      await websiteService.merge(website1._id.toString(), [
        website2._id.toString(),
      ]);
    });

    it.each([
      ['', ['website1', 'website2', 'website3']],
      [() => `website.id: ${website1.id}`, ['website1']],
      [() => `-website.id: ${website1.id}`, ['website2', 'website3']],

      // Projects
      ['project: "project*"', ['website1', 'website2', 'website3']],
      ['project: "project 1"', ['website1', 'website2']],
      ['project: "project 2"', ['website3']],
      ['-project: "project 2"', ['website1', 'website2']],
      ['project.name: "project*"', ['website1', 'website2', 'website3']],
      ['project.name: "project 1"', ['website1', 'website2']],
      ['project.name: "project 2"', ['website3']],
      ['-project.name: "project 2"', ['website1', 'website2']],
      [() => `project.id: ${project1.id}`, ['website1', 'website2']],
      [() => `project.id: ${project2.id}`, ['website3']],
      [() => `-project.id: ${project2.id}`, ['website1', 'website2']],

      // Domain
      ['domain: d1', ['website1', 'website2']],
      ['-domain: d1', ['website3']],
      ['domain: d2', ['website3']],
      ['domain.name: d1', ['website1', 'website2']],
      ['-domain.name: d1', ['website3']],
      ['domain.name: d2', ['website3']],
      [() => `domain.id: ${domain1.id}`, ['website1', 'website2']],
      [() => `-domain.id: ${domain1.id}`, ['website3']],
      [() => `domain.id: ${domain2.id}`, ['website3']],

      // Host
      ['host.ip: 1.1.1.1', ['website1', 'website2']],
      ['-host.ip: 1.1.1.1', ['website3']],
      ['host.ip: 1.1.*', ['website1', 'website2']],
      ['-host.ip: 1.1.*', ['website3']],
      ['host.ip: 1.*', ['website1', 'website2', 'website3']],
      ['-host.ip: 1.*', []],
      ['host.ip: 1.2.2.2', ['website3']],
      ['-host.ip: 1.2.2.2', ['website1', 'website2']],
      [() => `host.id: ${host1.id}`, ['website1', 'website2']],
      [() => `-host.id: ${host1.id}`, ['website3']],
      [() => `host.id: ${host2.id}`, ['website3']],

      // Tag
      ['tag: foo', ['website1', 'website2']],
      ['-tag: foo', ['website3']],
      ['tag: ba*', ['website3']],
      ['-tag: ba*', ['website1']],
      [() => `tag.id: ${foo.id}`, ['website1', 'website2']],
      [() => `-tag.id: ${foo.id}`, ['website3']],

      // Port
      ['port: 80', ['website1', 'website2']],
      ['-port: 80', ['website3']],
      ['port: 443', ['website3']],
      ['-port: 443', ['website1', 'website2']],
      [() => `port.id: ${port3.id}`, ['website3']],
      [() => `-port.id: ${port3.id}`, ['website1', 'website2']],

      // MergedIn
      [() => `mergedIn.id: ${website1.id}`, ['website2']],
      [() => `-mergedIn.id: ${website1.id}`, ['website1', 'website3']],

      // Is
      ['is: blocked', ['website3']],
      ['-is: blocked', ['website1', 'website2']],
      ['is: merged', ['website2']],
      ['-is: merged', ['website1', 'website3']],
    ])(
      'Filter by "%s"',
      async (query: string | (() => string), expected: string[]) => {
        // Arrange
        if (typeof query !== 'string') query = query();

        // Act
        const websites = await websiteService.getAll(0, 10, {
          query,
        });

        // Assert
        expect(websites.map((x) => x.path).sort()).toStrictEqual(
          expected.map((x) => x).sort(),
        );
      },
    );
  });

  describe('Merge and unmerge websites', () => {
    let project1: ProjectDocument;
    let domain1: DomainDocument;
    let host1: HostDocument;
    let port1: PortDocument;

    let website1: WebsiteDocument;
    let website2: WebsiteDocument;
    let website3: WebsiteDocument;

    beforeEach(async () => {
      // Arrange
      project1 = await project('project 1');
      domain1 = await domain('example.com', project1);
      [host1] = await hostForDomain(domain1, [], '1.1.1.1');
      port1 = await port(80, host1, 'tcp');

      website1 = await website('website1', domain1, host1, port1);
      website2 = await website('website2', domain1, host1, port1);
      website3 = await website('website3', domain1, host1, port1);
    });

    it('Should merge websites together - No prior merge', async () => {
      // Arrange
      // Act
      await websiteService.merge(website1._id.toString(), [
        website2._id.toString(),
        website3._id.toString(),
      ]);

      // Assert
      const updatedWebsite1 = await websiteService.get(website1._id.toString());
      expect(updatedWebsite1.mergedInId).toBeNull();

      const updatedWebsite2 = await websiteService.get(website2._id.toString());
      expect(updatedWebsite2.mergedInId.toString()).toEqual(
        website1._id.toString(),
      );

      const updatedWebsite3 = await websiteService.get(website3._id.toString());
      expect(updatedWebsite3.mergedInId.toString()).toEqual(
        website1._id.toString(),
      );
    });

    it('Should merge websites together - Prior merge', async () => {
      // Arrange
      await websiteService.merge(website2._id.toString(), [
        website3._id.toString(),
      ]);

      // Act
      await websiteService.merge(website1._id.toString(), [
        website2._id.toString(),
        website3._id.toString(),
      ]);

      // Assert
      const updatedWebsite1 = await websiteService.get(website1._id.toString());
      expect(updatedWebsite1.mergedInId).toBeNull();

      const updatedWebsite2 = await websiteService.get(website2._id.toString());
      expect(updatedWebsite2.mergedInId.toString()).toEqual(
        website1._id.toString(),
      );

      const updatedWebsite3 = await websiteService.get(website3._id.toString());
      expect(updatedWebsite3.mergedInId.toString()).toEqual(
        website1._id.toString(),
      );
    });
  });

  async function host(
    ip: string,
    project: ProjectDocument,
  ): Promise<HostDocument> {
    return await hostService.addHost(ip, project._id.toString());
  }

  async function port(
    port: number,
    host: HostDocument,
    protocol: 'tcp' | 'udp' = 'tcp',
  ) {
    return await portService.addPort(
      host._id.toString(),
      host.projectId.toString(),
      port,
      protocol,
    );
  }

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name };
    return await projectService.addProject(ccDto);
  }

  async function hostForDomain(
    domain: Domain,
    tags: TagsDocument[] = [],
    ...ips: string[]
  ) {
    return await hostService.addHostsWithDomain(
      ips,
      domain.name,
      domain.projectId.toString(),
      tags.map((x) => x.id),
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

  async function block(...hosts: HostDocument[]) {
    await hostService.batchEdit({
      block: true,
      hostIds: hosts.map((x) => x.id),
    });
  }

  async function website(
    path: string,
    domain: DomainDocument,
    host: HostDocument,
    port: PortDocument,
    tags: TagsDocument[] = [],
    isBlocked = false,
  ) {
    const website = await websiteService.addWebsite(
      domain.projectId.toString(),
      host.ip,
      port.port,
      domain.name,
      path,
    );

    for (const tag of tags) {
      await websiteService.tagWebsite(
        website._id.toString(),
        tag._id.toString(),
        true,
      );
    }

    if (isBlocked) {
      await websiteService.batchEdit({
        block: true,
        websiteIds: [website._id],
      });
    }

    return website;
  }
});
