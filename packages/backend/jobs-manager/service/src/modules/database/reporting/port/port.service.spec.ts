import { Test, TestingModule } from '@nestjs/testing';
import { getName } from '../../../../test/test.utils';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectService } from '../project.service';
import { PortService } from './port.service';

describe('Port Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let portService: PortService;
  const testPrefix = 'port-service-ut';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    domainService = moduleFixture.get(DomainsService);
    projectService = moduleFixture.get(ProjectService);
    tagsService = moduleFixture.get(TagsService);
    portService = moduleFixture.get(PortService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
  });

  describe('Add ports', () => {
    it('Should add ports to a host', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());

      // Act
      const p1 = await portService.addPort(
        h[0]._id.toString(),
        c._id.toString(),
        22,
        'tcp',
      );
      const p2 = await portService.addPort(
        h[0]._id.toString(),
        c._id.toString(),
        21,
        'tcp',
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.hostId.toString()).toStrictEqual(h[0]._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.hostId.toString()).toStrictEqual(h[0]._id.toString());
    });

    it('Should add ports to a host IP', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const c = await project();
      const h = await host(hostIp, c._id.toString());

      // Act
      const p1 = await portService.addPortByIp(
        hostIp,
        c._id.toString(),
        22,
        'tcp',
      );
      const p2 = await portService.addPortByIp(
        hostIp,
        c._id.toString(),
        21,
        'tcp',
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.hostId.toString()).toStrictEqual(h[0]._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.hostId.toString()).toStrictEqual(h[0]._id.toString());
    });

    it('Should fail adding the same port to the same host', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const portNumber = 80;
      const samePort = async () => {
        return await portService.addPort(
          h[0]._id.toString(),
          c._id.toString(),
          portNumber,
          'tcp',
        );
      };

      // Act
      const p1 = await samePort();
      const p2 = await samePort();

      // Assert
      expect(p1).toBeTruthy();
      expect(p2).toStrictEqual(null);
    });

    it('Should add the same port to a different host', async () => {
      // Arrange
      const c = await project();
      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const portNumber = 80;

      // Act
      const p1 = await portService.addPort(
        h1[0]._id.toString(),
        c._id.toString(),
        portNumber,
        'tcp',
      );
      const p2 = await portService.addPort(
        h2[0]._id.toString(),
        c._id.toString(),
        portNumber,
        'tcp',
      );

      // Assert
      expect(p1.port).toStrictEqual(80);
      expect(p2.port).toStrictEqual(80);
    });
  });

  describe('Get ports', () => {
    it('Should return the ports in order of popularity', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const portNumbers = [22, 8080, 21, 443, 80];
      const portsAdded = [];
      for (let portNumber of portNumbers) {
        portsAdded.push(
          await portService.addPort(
            h[0]._id.toString(),
            c._id.toString(),
            portNumber,
            'tcp',
          ),
        );
      }

      // Act
      const ports = await portService.getHostTopTcpPorts(
        h[0]._id.toString(),
        0,
        10,
        'number',
      );

      // Assert
      expect(ports.length).toStrictEqual(5);
      expect(ports[0].port).toStrictEqual(80);
      expect(ports[1].port).toStrictEqual(443);
      expect(ports[2].port).toStrictEqual(21);
      expect(ports[3].port).toStrictEqual(22);
      expect(ports[4].port).toStrictEqual(8080);
    });
    it('Should return the ports in order of popularity with paging', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const portNumbers = [22, 8080, 21, 443, 80];
      const portsAdded = [];
      for (let portNumber of portNumbers) {
        portsAdded.push(
          await portService.addPort(
            h[0]._id.toString(),
            c._id.toString(),
            portNumber,
            'tcp',
          ),
        );
      }

      // Act
      const ports = await portService.getHostTopTcpPorts(
        h[0]._id.toString(),
        0,
        3,
        'number',
      );

      // Assert
      expect(ports.length).toStrictEqual(3);
      expect(ports[0].port).toStrictEqual(80);
      expect(ports[1].port).toStrictEqual(443);
      expect(ports[2].port).toStrictEqual(21);
    });
    it('Should get the TCP ports in an arbitrary order', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const portNumbers = [22, 8080, 21, 443, 80];
      const portsAdded = [];
      for (let portNumber of portNumbers) {
        portsAdded.push(
          await portService.addPort(
            h[0]._id.toString(),
            c._id.toString(),
            portNumber,
            'tcp',
          ),
        );
      }

      // Act
      const ports = await portService.getHostPorts(
        h[0]._id.toString(),
        0,
        10,
        'tcp',
      );

      // Assert
      expect(ports.length).toStrictEqual(5);
    });

    it('Should get the TCP ports in an arbitrary order with paging', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const portNumbers = [22, 8080, 21, 443, 80];
      const portsAdded = [];
      for (let portNumber of portNumbers) {
        portsAdded.push(
          await portService.addPort(
            h[0]._id.toString(),
            c._id.toString(),
            portNumber,
            'tcp',
          ),
        );
      }

      // Act
      const ports = await portService.getHostPorts(
        h[0]._id.toString(),
        0,
        3,
        'tcp',
      );

      // Assert
      expect(ports.length).toStrictEqual(3);
    });
  });

  describe('Delete ports', () => {
    it('Should delete a port by id', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const p1 = await portService.addPort(
        h[0]._id.toString(),
        c._id.toString(),
        22,
        'tcp',
      );

      // Act
      const res = await portService.delete(p1._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(1);
    });

    it('Should delete all ports for a host', async () => {
      // Arrange
      const c = await project();
      const h = await host('1.1.1.1', c._id.toString());
      const p1 = await portService.addPort(
        h[0]._id.toString(),
        c._id.toString(),
        22,
        'tcp',
      );

      const p2 = await portService.addPort(
        h[0]._id.toString(),
        c._id.toString(),
        80,
        'tcp',
      );

      // Act
      const res = await portService.deleteAllForHost(h[0]._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(2);
    });
  });

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name: `${getName(testPrefix)}` };
    return await projectService.addProject(ccDto);
  }

  async function host(ip: string, projectId: string) {
    return await await hostService.addHosts([ip], projectId);
  }

  afterAll(async () => {
    await moduleFixture.close();
  });
});
