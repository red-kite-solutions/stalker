import { Test, TestingModule } from '@nestjs/testing';
import { getName } from '../../../../test/test.utils';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectService } from '../project.service';

import { PortService } from '../port/port.service';
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
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h[0]._id.toString(), c._id.toString());

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
        portNumber,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h[0]._id.toString());
      expect(w1.path).toStrictEqual('/');
      expect(w1.domain).toBeNull();
    });

    it('Should create a website for a host with domain without path', async () => {
      // Arrange
      const portNumber = 22;
      const domainName = 'example.com';
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h[0]._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
        portNumber,
        domainName,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h[0]._id.toString());
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
      const p = await port(portNumber, h[0]._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
        portNumber,
        domainName,
        path,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h[0]._id.toString());
      expect(w1.path).toStrictEqual(path);
      expect(w1.domain.name).toStrictEqual(domainName);
    });

    it('Should create a website for a host without domain, but with path', async () => {
      // Arrange
      const portNumber = 22;
      const path = '/example/asdf/';
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const p = await port(portNumber, h[0]._id.toString(), c._id.toString());

      // Act
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
        portNumber,
        '',
        path,
      );

      // Assert
      expect(w1._id).toBeTruthy();
      expect(w1.port.id.toString()).toStrictEqual(p._id.toString());
      expect(w1.host.id.toString()).toStrictEqual(h[0]._id.toString());
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
      const p = await port(portNumber, h[0]._id.toString(), c._id.toString());
      const d = await domain(domainName, c._id.toString());
      const w1 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
        portNumber,
        domainName,
        path,
      );

      // Act
      const w2 = await websiteService.addWebsite(
        c._id.toString(),
        h[0].ip,
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

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name: `${getName(testPrefix)}` };
    return await projectService.addProject(ccDto);
  }

  async function host(ip: string, projectId: string) {
    return await hostService.addHosts([ip], projectId);
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
});
