import { Test, TestingModule } from '@nestjs/testing';
import { getName } from '../../../../test/test.utils';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectService } from '../project.service';

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DomainDocument } from '../domain/domain.model';
import { HostDocument } from '../host/host.model';
import { PortDocument } from '../port/port.model';
import { PortService } from '../port/port.service';
import { WebsiteFilterModel } from './website-filter.model';
import { Website, WebsiteDocument } from './website.model';
import { WebsiteService } from './website.service';

describe('Website Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let portService: PortService;
  let websiteService: WebsiteService;
  const testPrefix = 'website-service-ut';
  let websiteModel: Model<Website>;

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
    websiteModel = moduleFixture.get<Model<Website>>(getModelToken('websites'));
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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h._id.toString(), c._id.toString());

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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());

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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());

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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h._id.toString(), c._id.toString());

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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());
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

  describe('Get websites with filters', () => {
    const ips = ['1.1.1.1', '1.1.1.1', '2.2.2.2', '2.2.2.2', '3.3.3.3'];
    const ports = [80, 443, 80, 80, 8080];
    const domains = [
      'example.com',
      'example.com',
      'example.com',
      'www.example.com',
      '',
    ];

    it('Should filter a website by domain', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      const filter: WebsiteFilterModel = { domains: ['www.example.com'] };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[3]._id.toString(),
      );
    });

    it('Should filter websites by tag', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      const tag = await tagsService.create('website-test-tag', '#c0ffee');
      await websiteService.tagWebsite(
        websites[2]._id.toString(),
        tag._id.toString(),
        true,
      );
      const filter: WebsiteFilterModel = { tags: [tag._id.toString()] };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[2]._id.toString(),
      );
    });

    it('Should filter websites by host', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      const filter: WebsiteFilterModel = { hosts: ['1.1.1.1'] };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(2);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[0]._id.toString(),
      );
      expect(filteredWebsites[1]._id.toString()).toStrictEqual(
        websites[1]._id.toString(),
      );
    });

    it('Should filter websites by port', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      const filter: WebsiteFilterModel = { ports: [8080] };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[4]._id.toString(),
      );
    });

    it('Should filter websites by project', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      const websites2 = await bulkWebsites(['1.2.3.4'], [80], ['example.org']);
      const filter: WebsiteFilterModel = {
        project: [websites2[0].projectId.toString()],
      };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites2[0]._id.toString(),
      );
    });

    it('Should filter websites by merged', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      await websiteModel.updateOne(
        { _id: { $eq: websites[1]._id } },
        { $set: { mergedInId: websites[2]._id } },
      );
      const filter: WebsiteFilterModel = { merged: true };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[1]._id.toString(),
      );
    });

    it('Should filter websites by blocked', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      await websiteService.batchEdit({
        block: true,
        websiteIds: [websites[2]._id],
      });
      const filter: WebsiteFilterModel = { blocked: true };

      // Act
      const filteredWebsites = await websiteService.getAll(
        0,
        ips.length,
        filter,
      );

      // Assert
      expect(filteredWebsites.length).toStrictEqual(1);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[2]._id.toString(),
      );
    });

    it('Should get websites with paging', async () => {
      // Arrange
      const websites = await bulkWebsites(ips, ports, domains);
      await websiteService.batchEdit({
        block: true,
        websiteIds: [websites[2]._id],
      });
      const filter: WebsiteFilterModel = {};

      // Act
      const filteredWebsites = await websiteService.getAll(1, 2, filter);

      // Assert
      expect(filteredWebsites.length).toStrictEqual(2);
      expect(filteredWebsites[0]._id.toString()).toStrictEqual(
        websites[2]._id.toString(),
      );
      expect(filteredWebsites[1]._id.toString()).toStrictEqual(
        websites[3]._id.toString(),
      );
    });
  });

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name: `${getName(testPrefix)}` };
    return await projectService.addProject(ccDto);
  }

  async function host(ip: string, projectId: string): Promise<HostDocument> {
    return await hostService.addHost(ip, projectId);
  }

  async function domain(name: string, projectId: string) {
    return await domainService.addDomain(name, projectId);
  }

  async function port(
    port: number,
    hostId: string,
    projectId: string,
    protocol: 'tcp' | 'udp' = 'tcp',
  ) {
    return await portService.addPort(hostId, projectId, port, protocol);
  }

  async function bulkWebsites(
    ips: string[],
    portNumbers: number[],
    domainNames: string[],
    paths: string[] = undefined,
  ): Promise<WebsiteDocument[]> {
    if (
      ips.length !== portNumbers.length ||
      ips.length !== domainNames.length ||
      (paths !== undefined && ips.length !== paths.length)
    )
      throw new Error(
        'When creating websites in bulk, the arrays should have the same length',
      );

    const c = await project();
    const hosts: HostDocument[] = [];
    for (const ip of ips) {
      hosts.push(await host(ip, c._id.toString()));
    }

    const ports: PortDocument[] = [];
    for (let i = 0; i < portNumbers.length; ++i) {
      ports.push(
        await port(portNumbers[i], hosts[i]._id.toString(), c._id.toString()),
      );
    }

    const domains: DomainDocument[] = [];
    for (const d of domainNames) {
      domains.push(await domain(d, c._id.toString()));
    }

    if (paths === undefined) {
      paths = Array(ips.length).fill('/');
    }

    const websites: WebsiteDocument[] = [];
    for (let i = 0; i < hosts.length; ++i) {
      websites.push(
        await websiteService.addWebsite(
          c._id.toString(),
          hosts[i].ip,
          ports[i].port,
          domains[i].name,
          paths[i],
        ),
      );
    }

    return websites;
  }
});
