import { Test, TestingModule } from '@nestjs/testing';
import { getName } from '../../../../../test/test.utils';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { CreateCompanyDto } from '../company.dto';
import { CompanyService } from '../company.service';
import { DomainsService } from '../domain/domain.service';
import { HostService } from '../host/host.service';
import { PortService } from './port.service';

describe('Port Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let domainService: DomainsService;
  let companyService: CompanyService;
  let tagsService: TagsService;
  let portService: PortService;
  const testPrefix = 'port-service-ut';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    domainService = moduleFixture.get(DomainsService);
    companyService = moduleFixture.get(CompanyService);
    tagsService = moduleFixture.get(TagsService);
    portService = moduleFixture.get(PortService);
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
  });

  describe('Add ports', () => {
    it('Should add ports to a host', async () => {
      // Arrange
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts(
        ['1.1.1.1'],
        c._id.toString(),
        c.name,
      );

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
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts([hostIp], c._id.toString(), c.name);

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
  });

  describe('Get ports', () => {
    it('Should return the ports in order of popularity', async () => {
      // Arrange
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts(
        ['1.1.1.1'],
        c._id.toString(),
        c.name,
      );
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
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts(
        ['1.1.1.1'],
        c._id.toString(),
        c.name,
      );
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
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts(
        ['1.1.1.1'],
        c._id.toString(),
        c.name,
      );
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
      const ccDto: CreateCompanyDto = { name: `${getName(testPrefix)}` };
      const c = await companyService.addCompany(ccDto);
      const h = await hostService.addHosts(
        ['1.1.1.1'],
        c._id.toString(),
        c.name,
      );
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

  afterAll(async () => {
    await moduleFixture.close();
  });
});
