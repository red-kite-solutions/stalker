import { Test, TestingModule } from '@nestjs/testing';
import { getName } from '../../../../test/test.utils';
import { AppModule } from '../../../app.module';
import { TagsDocument } from '../../tags/tag.model';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectService } from '../project.service';
import { GetPortsDto } from './port.dto';
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
    const tags = await tagsService.getAll();
    for (const t of tags) {
      await tagsService.delete(t._id);
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
      expect(p1.host.id.toString()).toStrictEqual(h[0]._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.host.id.toString()).toStrictEqual(h[0]._id.toString());
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
      expect(p1.host.id.toString()).toStrictEqual(h[0]._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.host.id.toString()).toStrictEqual(h[0]._id.toString());
    });

    it('Should add ports with a service to a host IP', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const service = 'ssh';
      const c = await project();
      const h = await host(hostIp, c._id.toString());

      // Act
      const p1 = await portService.addPortByIp(
        hostIp,
        c._id.toString(),
        22,
        'tcp',
        service,
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h[0]._id.toString());
      expect(p1.service).toStrictEqual(service);
    });

    it('Should add the service to an existing port', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const service = 'ssh';
      const c = await project();
      const h = await host(hostIp, c._id.toString());

      // Act
      let p1 = await portService.addPortByIp(
        hostIp,
        c._id.toString(),
        22,
        'tcp',
      );

      p1 = await portService.addPortByIp(
        hostIp,
        c._id.toString(),
        22,
        'tcp',
        service,
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h[0]._id.toString());
      expect(p1.service).toStrictEqual(service);
    });

    it('Should update a port that already exists instead of creating it', async () => {
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
      expect(p2._id.toString()).toStrictEqual(p1._id.toString());
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

    it('Should add the same port to two hosts with the same ip for a different project', async () => {
      // Arrange
      const c = await project('project 1');
      const c2 = await project('project 2');
      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.1', c2._id.toString());
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
        c2._id.toString(),
        portNumber,
        'tcp',
      );

      // Assert
      expect(p1.port).toStrictEqual(80);
      expect(p1.host.ip).toStrictEqual(h1[0].ip);
      expect(p1.projectId.toString()).toStrictEqual(c._id.toString());
      expect(p2.port).toStrictEqual(80);
      expect(p2.host.ip).toStrictEqual(h2[0].ip);
      expect(p2.projectId.toString()).toStrictEqual(c2._id.toString());
    });
  });

  describe('Get ports', () => {
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
  describe('Get all', () => {
    it.each([
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { host: ['1.1.1.1'] },
        [1, 2, 3],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { host: ['1.2'] },
        [4, 5, 6],
      ],
      [
        [
          { host: '1.2.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { host: ['1.2'] },
        [1, 2, 3, 4, 5, 6],
      ],
    ])(
      'Filter by host',
      async (
        hosts: { host: string; ports: number[] }[],
        dto: Partial<GetPortsDto>,
        expectedPorts: number[],
      ) => {
        // Arrange
        const p1 = await project('p1');

        for (const h of hosts) {
          const htmp = await host(h.host, p1._id.toString());
          for (const p of h.ports) {
            await portService.addPort(
              htmp[0]._id.toString(),
              p1._id.toString(),
              p,
              'tcp',
            );
          }
        }

        // Act
        const allPorts = await portService.getAll(0, 10, dto);

        // Assert
        expect(allPorts.map((x) => x.port).sort()).toStrictEqual(
          expectedPorts.sort(),
        );
      },
    );

    it.each([
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3], tags: ['asdf'] },
          { host: '1.1.1.2', ports: [4, 5, 6], tags: ['qwerty'] },
        ],
        { tags: ['asdf'] },
        [1, 2, 3],
        ['asdf', 'qwerty'],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3], tags: ['asdf'] },
          { host: '1.1.1.2', ports: [4, 5, 6], tags: ['qwerty'] },
        ],
        { tags: ['qwerty'] },
        [4, 5, 6],
        ['asdf', 'qwerty'],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3], tags: ['asdf'] },
          { host: '1.1.1.2', ports: [4, 5, 6], tags: ['qwerty'] },
        ],
        { host: ['1.2'], tags: ['qwerty'] },
        [4, 5, 6],
        ['asdf', 'qwerty'],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3], tags: ['asdf'] },
          { host: '1.1.1.2', ports: [4, 5, 6], tags: ['qwerty', 'asdf'] },
        ],
        { tags: ['asdf'] },
        [1, 2, 3, 4, 5, 6],
        ['asdf', 'qwerty'],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3], tags: ['asdf'] },
          { host: '1.1.1.2', ports: [4, 5, 6], tags: ['qwerty'] },
        ],
        { host: ['1.2'], tags: ['asdf'] },
        [],
        ['asdf', 'qwerty'],
      ],
    ])(
      'Filter by tag',
      async (
        hosts: { host: string; ports: number[]; tags: string[] }[],
        dto: Partial<GetPortsDto>,
        expectedPorts: number[],
        tags: string[],
      ) => {
        // Arrange
        const p1 = await project('p1');

        const tagsMap: Map<string, TagsDocument> = new Map<
          string,
          TagsDocument
        >();
        for (const t of tags) {
          tagsMap.set(t, await tagsService.create(t, '#ffffff'));
        }

        const hDocs = [];

        for (let j = 0; j < hosts.length; ++j) {
          const htmp = await host(hosts[j].host, p1._id.toString());
          hDocs.push(htmp[0]);
          for (let i = 0; i < hosts[j].tags.length; ++i) {
            hosts[j].tags[i] = tagsMap.get(hosts[j].tags[i])._id.toString();
          }

          for (const p of hosts[j].ports) {
            const ptmp = await portService.addPort(
              htmp[0]._id.toString(),
              p1._id.toString(),
              p,
              'tcp',
            );
            for (const t of hosts[j].tags) {
              await portService.tagPort(ptmp._id.toString(), t, true);
            }
          }
        }

        for (let i = 0; i < dto.tags.length; ++i) {
          dto.tags[i] = tagsMap.get(dto.tags[i])._id.toString();
        }

        // Act
        const allPorts = await portService.getAll(0, 10, dto);

        // Assert
        expect(allPorts.map((x) => x.port).sort()).toStrictEqual(
          expectedPorts.sort(),
        );
      },
    );

    it.each([
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { ports: [5] },
        [5],
      ],
      [
        [
          { host: '1.2.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { ports: [3] },
        [3],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { host: ['1.1.1.1'], ports: [3] },
        [3],
      ],
      [
        [
          { host: '1.1.1.1', ports: [1, 2, 3] },
          { host: '1.1.1.2', ports: [4, 5, 6] },
        ],
        { host: ['1.1.1.1'], ports: [5] },
        [],
      ],
    ])(
      'Filter by port',
      async (
        hosts: { host: string; ports: number[] }[],
        dto: Partial<GetPortsDto>,
        expectedPorts: number[],
      ) => {
        // Arrange
        const p1 = await project('p1');

        const hDocs = [];

        for (const h of hosts) {
          const htmp = await host(h.host, p1._id.toString());
          hDocs.push(htmp[0]);
          for (const p of h.ports) {
            await portService.addPort(
              htmp[0]._id.toString(),
              p1._id.toString(),
              p,
              'tcp',
            );
          }
        }

        // Act
        const allPorts = await portService.getAll(0, 10, dto);

        // Assert
        expect(allPorts.map((x) => x.port).sort()).toStrictEqual(
          expectedPorts.sort(),
        );
      },
    );
  });

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name: `${getName(testPrefix)}` };
    return await projectService.addProject(ccDto);
  }

  async function host(ip: string, projectId: string) {
    return await hostService.addHosts([ip], projectId);
  }

  afterAll(async () => {
    await moduleFixture.close();
  });
});
