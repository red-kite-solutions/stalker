import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../../app.module';
import { TagsDocument } from '../../tags/tag.model';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { HostDocument } from '../host/host.model';
import { HostService } from '../host/host.service';
import { CreateProjectDto } from '../project.dto';
import { ProjectDocument } from '../project.model';
import { ProjectService } from '../project.service';
import { Port, PortDocument } from './port.model';
import { PortService } from './port.service';

describe('Port Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let portService: PortService;

  let project1: ProjectDocument;
  let portModel: Model<Port>;
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
    portModel = moduleFixture.get<Model<Port>>(getModelToken('port'));
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

    project1 = await project('my first project');
  });

  describe('Add ports', () => {
    it('Should add ports to a host', async () => {
      // Arrange
      const h = await host('1.1.1.1', project1);

      // Act
      const p1 = await portService.addPort(
        h._id.toString(),
        project1._id.toString(),
        22,
        'tcp',
      );
      const p2 = await portService.addPort(
        h._id.toString(),
        project1._id.toString(),
        21,
        'tcp',
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.host.id.toString()).toStrictEqual(h._id.toString());
    });

    it('Should add ports to a host IP', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const h = await host(hostIp, project1);

      // Act
      const p1 = await portService.addPortByIp(
        hostIp,
        project1._id.toString(),
        22,
        'tcp',
      );
      const p2 = await portService.addPortByIp(
        hostIp,
        project1._id.toString(),
        21,
        'tcp',
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h._id.toString());

      expect(p2._id).toBeTruthy();
      expect(p2.port).toStrictEqual(21);
      expect(p2.host.id.toString()).toStrictEqual(h._id.toString());
    });

    it('Should add ports with a service to a host IP', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const service = 'ssh';
      const h = await host(hostIp, project1);

      // Act
      const p1 = await portService.addPortByIp(
        hostIp,
        project1._id.toString(),
        22,
        'tcp',
        service,
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(p1.service).toStrictEqual(service);
    });

    it('Should add the service to an existing port', async () => {
      // Arrange
      const hostIp = '1.1.1.1';
      const service = 'ssh';
      const h = await host(hostIp, project1);

      // Act
      let p1 = await portService.addPortByIp(
        hostIp,
        project1._id.toString(),
        22,
        'tcp',
      );

      p1 = await portService.addPortByIp(
        hostIp,
        project1._id.toString(),
        22,
        'tcp',
        service,
      );

      // Assert
      expect(p1._id).toBeTruthy();
      expect(p1.port).toStrictEqual(22);
      expect(p1.host.id.toString()).toStrictEqual(h._id.toString());
      expect(p1.service).toStrictEqual(service);
    });

    it('Should update a port that already exists instead of creating it', async () => {
      // Arrange
      const h = await host('1.1.1.1', project1);
      const portNumber = 80;
      const samePort = async () => {
        return await portService.addPort(
          h._id.toString(),
          project1._id.toString(),
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
      const p = await project();
      const h1 = await host('1.1.1.1', p);
      const h2 = await host('1.1.1.2', p);
      const portNumber = 80;

      // Act
      const p1 = await portService.addPort(
        h1._id.toString(),
        p._id.toString(),
        portNumber,
        'tcp',
      );
      const p2 = await portService.addPort(
        h2._id.toString(),
        p._id.toString(),
        portNumber,
        'tcp',
      );

      // Assert
      expect(p1.port).toStrictEqual(80);
      expect(p2.port).toStrictEqual(80);
    });

    it('Should add the same port to two hosts with the same ip for a different project', async () => {
      // Arrange
      const proj1 = await project('project 1');
      const proj2 = await project('project 2');
      const h1 = await host('1.1.1.1', proj1);
      const h2 = await host('1.1.1.1', proj2);
      const portNumber = 80;

      // Act
      const p1 = await portService.addPort(
        h1._id.toString(),
        proj1._id.toString(),
        portNumber,
        'tcp',
      );
      const p2 = await portService.addPort(
        h2._id.toString(),
        proj2._id.toString(),
        portNumber,
        'tcp',
      );

      // Assert
      expect(p1.port).toStrictEqual(80);
      expect(p1.host.ip).toStrictEqual(h1.ip);
      expect(p1.projectId.toString()).toStrictEqual(proj1._id.toString());
      expect(p2.port).toStrictEqual(80);
      expect(p2.host.ip).toStrictEqual(h2.ip);
      expect(p2.projectId.toString()).toStrictEqual(proj2._id.toString());
    });
  });

  describe('Get ports', () => {
    it('Should get the TCP ports in an arbitrary order', async () => {
      // Arrange
      const h = await host('1.1.1.1', project1);
      await port(22, h, project1);
      await port(8080, h, project1);
      await port(21, h, project1);
      await port(443, h, project1);
      await port(80, h, project1);

      // Act
      const ports = await portService.getHostPorts(
        h._id.toString(),
        0,
        10,
        'tcp',
      );

      // Assert
      expect(ports.length).toStrictEqual(5);
      expect(ports.map((x) => x.port)).toContain(22);
      expect(ports.map((x) => x.port)).toContain(8080);
      expect(ports.map((x) => x.port)).toContain(21);
      expect(ports.map((x) => x.port)).toContain(443);
      expect(ports.map((x) => x.port)).toContain(80);
    });

    it('Should get the TCP ports in an arbitrary order with paging', async () => {
      // Arrange
      const h = await host('1.1.1.1', project1);
      await port(22, h, project1);
      await port(8080, h, project1);
      await port(21, h, project1);
      await port(443, h, project1);
      await port(80, h, project1);

      // Act
      const ports = await portService.getHostPorts(
        h._id.toString(),
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
      const h = await host('1.1.1.1', project1);
      const [p1] = await port(22, h, project1);

      // Act
      const res = await portService.delete(p1._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(1);
    });

    it('Should delete all ports for a host', async () => {
      // Arrange
      const h = await host('1.1.1.1', project1);
      await port(22, h, project1);
      await port(80, h, project1);

      // Act
      const res = await portService.deleteAllForHost(h._id.toString());

      // Assert
      expect(res.deletedCount).toStrictEqual(2);
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

    let p1: PortDocument;
    let p2: PortDocument;
    let p3: PortDocument;
    let p4: PortDocument;
    let p5: PortDocument;
    let p6: PortDocument;

    beforeEach(async () => {
      // Arrange
      project1 = await project('project 1');
      project2 = await project('project 2');
      [foo, bar, baz, qux] = await tags('foo', 'bar', 'baz', 'qux');

      h1 = await host('1.1.1.1', project1);
      [p1, p2] = await port([1, 2], h1, project1, [foo, qux]);

      h2 = await host('1.2.2.2', project1);
      [p3, p4] = await port([3, 4], h2, project1, [bar, qux]);

      h3 = await host('1.2.2.3', project2);
      [p5] = await port([5], h3, project2, [baz, qux]);
      [p6] = await port([6], h3, project2, [baz, qux], 'udp');
      await block(p6);
    });

    it.each([
      ['', [1, 2, 3, 4, 5, 6]],

      // Projects
      ['project: "project*"', [1, 2, 3, 4, 5, 6]],
      ['project: "project 1"', [1, 2, 3, 4]],
      ['project: "project 2"', [5, 6]],
      ['-project: "project 2"', [1, 2, 3, 4]],
      ['project.name: "project*"', [1, 2, 3, 4, 5, 6]],
      ['project.name: "project 1"', [1, 2, 3, 4]],
      ['project.name: "project 2"', [5, 6]],
      ['-project.name: "project 2"', [1, 2, 3, 4]],
      [() => `project.id: ${project1.id}`, [1, 2, 3, 4]],
      [() => `project.id: ${project2.id}`, [5, 6]],
      [() => `-project.id: ${project2.id}`, [1, 2, 3, 4]],

      // Host
      ['host: 1.1.1.1', [1, 2]],
      ['host.ip: 1.1.1.1', [1, 2]],
      [() => `host.id: ${h1._id}`, [1, 2]],
      ['host: 1.*', [1, 2, 3, 4, 5, 6]],
      ['host: 1.2.2*', [3, 4, 5, 6]],
      ['-host: 1.1.1.1', [3, 4, 5, 6]],
      ['-host.ip: 1.1.1.1', [3, 4, 5, 6]],
      [() => `-host.id: ${h1.id}`, [3, 4, 5, 6]],
      ['-host: 1.2.2*', [1, 2]],

      // Port
      ['port: 1', [1]],
      ['port.number: 1', [1]],
      [() => `port.id: ${p1.id}`, [1]],
      [() => `-port.id: ${p1.id} -port.id: ${p3.id}`, [2, 4, 5, 6]],
      ['-port: 1', [2, 3, 4, 5, 6]],
      ['port.protocol: tcp', [1, 2, 3, 4, 5]],
      ['-port.protocol: tcp', [6]],
      ['port.protocol: udp', [6]],
      ['-port.protocol: udp', [1, 2, 3, 4, 5]],

      // Tag
      ['tag: foo', [1, 2]],
      [() => `tag.id: ${foo._id}`, [1, 2]],
      [() => `-tag.id: ${foo._id}`, [3, 4, 5, 6]],
      ['-tag: ba*', [1, 2]],
      ['-tag: foo', [3, 4, 5, 6]],
      ['tag: qux', [1, 2, 3, 4, 5, 6]],
      ['tag: foo tag: qux', [1, 2]],
      ['-tag: foo tag: qux', [3, 4, 5, 6]],

      // Is
      ['is: blocked', [6]],
      ['-is: blocked', [1, 2, 3, 4, 5]],
    ])(
      'Filter by "%s"',
      async (query: string | (() => string), expected: number[]) => {
        // Arrange
        if (typeof query !== 'string') query = query();

        // Act
        const allPorts = await portService.getAll(0, 10, { query });

        // Assert
        expect(allPorts.map((x) => x.port).sort()).toStrictEqual(
          expected.sort(),
        );
      },
    );

    // TODO #319
    // //   it.each([
    // //     {
    // //       service: 'asdf',
    // //       product: 'qwerty',
    // //       version: 'uiop',
    // //       dto: { services: ['asdf1', 'asdf2'] },
    // //       expectedPorts: [1, 2],
    // //     },
    // //     {
    // //       service: 'asdf',
    // //       product: 'qwerty',
    // //       version: 'uiop',
    // //       dto: { services: ['asdf1', 'asdf2'], products: ['qwerty1'] },
    // //       expectedPorts: [1],
    // //     },
    // //     {
    // //       service: 'asdf',
    // //       product: 'qwerty',
    // //       version: 'uiop',
    // //       dto: { services: ['asdf1', 'asdf2'], versions: ['uiop2'] },
    // //       expectedPorts: [2],
    // //     },
    // //     {
    // //       service: 'asdf',
    // //       product: 'qWErty',
    // //       version: 'uiop',
    // //       dto: { services: ['asdf1', 'asdf2'], products: ['qwerty2', 'qwerty3'] },
    // //       expectedPorts: [2],
    // //     },
    // //     {
    // //       service: 'asdf',
    // //       product: 'qWErty',
    // //       version: 'uiOP',
    // //       dto: { versions: ['uiop3'], products: ['qwerty2', 'qwerty3'] },
    // //       expectedPorts: [3],
    // //     },
    // //   ])(
    // //     'Filter by service, product, version: %s',
    // //     async ({ service, product, version, dto, expectedPorts }) => {
    // //       // Arrange
    // //       const p1 = await project('p1');

    // //       const hosts = [{ host: '1.1.1.1', ports: [1, 2, 3, 4] }];
    // //       const hDocs = [];

    // //       const ports: PortDocument[] = [];

    // //       for (const h of hosts) {
    // //         const htmp = await host(h.host, p1._id.toString());
    // //         hDocs.push(htmp[0]);
    // //         for (const p of h.ports) {
    // //           ports.push(
    // //             await portService.addPort(
    // //               htmp[0]._id.toString(),
    // //               p1._id.toString(),
    // //               p,
    // //               'tcp',
    // //             ),
    // //           );
    // //         }
    // //       }

    // //       for (const port of ports) {
    // //         await portModel.updateOne(
    // //           { _id: { $eq: port._id } },
    // //           {
    // //             service: service + port.port,
    // //             product: product + port.port,
    // //             version: version + port.port,
    // //           },
    // //         );
    // //       }

    // //       // Act
    // //       const allPorts = await portService.getAll(0, 10, dto);

    // //       // Assert
    // //       expect(allPorts.map((x) => x.port).sort()).toStrictEqual(
    // //         expectedPorts.sort(),
    // //       );
    // //     },
    // //   );
  });

  async function project(name: string = '') {
    const ccDto: CreateProjectDto = { name };
    return await projectService.addProject(ccDto);
  }

  async function host(
    ip: string,
    project: ProjectDocument,
    tags: TagsDocument[] = [],
  ) {
    const h = (await hostService.addHosts([ip], project._id.toString()))[0];

    for (const t of tags) {
      await hostService.tagHost(h._id.toString(), t._id.toString(), true);
    }

    return h;
  }

  async function tags(...tags: string[]) {
    const createdTags: TagsDocument[] = [];
    for (const tag of tags) {
      createdTags.push(await tagsService.create(tag, '#ffffff'));
    }

    return createdTags;
  }

  async function port(
    ports: number | number[],
    host: HostDocument,
    project: ProjectDocument,
    tags: TagsDocument[] = [],
    protocol: 'tcp' | 'udp' = 'tcp',
  ) {
    if (typeof ports === 'number') {
      ports = [ports];
    }

    const portDocuments = [];
    for (const p of ports) {
      const bobbyNewport = await portService.addPort(
        host._id.toString(),
        project._id.toString(),
        p,
        protocol,
      );

      portDocuments.push(bobbyNewport);

      for (const t of tags) {
        await portService.tagPort(
          bobbyNewport._id.toString(),
          t._id.toString(),
          true,
        );
      }
    }

    return portDocuments;
  }

  async function block(...ports: PortDocument[]) {
    await portService.batchEdit({
      block: true,
      portIds: ports.map((x) => x.id),
    });
  }

  afterAll(async () => {
    await moduleFixture.close();
  });
});
