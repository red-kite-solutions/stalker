import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CorrelationKeyUtils } from '../../reporting/correlation.utils';
import { DomainDocument } from '../../reporting/domain/domain.model';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostDocument } from '../../reporting/host/host.model';
import { HostService } from '../../reporting/host/host.service';
import { PortService } from '../../reporting/port/port.service';
import { ProjectDocument } from '../../reporting/project.model';
import { ProjectService } from '../../reporting/project.service';
import { SubscriptionTriggersService } from './subscription-triggers.service';

describe('Subscriptions Triggers Service', () => {
  let moduleFixture: TestingModule;
  let triggersService: SubscriptionTriggersService;
  let domainService: DomainsService;
  let hostService: HostService;
  let portService: PortService;
  let projectService: ProjectService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    triggersService = moduleFixture.get(SubscriptionTriggersService);
    domainService = moduleFixture.get(DomainsService);
    hostService = moduleFixture.get(HostService);
    portService = moduleFixture.get(PortService);
    projectService = moduleFixture.get(ProjectService);
    // Without { doNotFake: ['nextTick'] } the tests timeout with fake timers
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
  });

  beforeEach(async () => {
    const allTriggers = await triggersService.getAll();
    for (const t of allTriggers) {
      await triggersService.delete(t._id.toString());
    }
    const allProjects = await projectService.getAllIds();
    for (const p of allProjects) {
      await projectService.delete(p);
    }
  });

  afterAll(async () => {
    jest.useRealTimers();
    await moduleFixture.close();
  });

  it('Triggers a subscription never triggered before', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Adds a new subscription trigger to the database', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );

    // Act
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    const triggers = await triggersService.getAll();
    expect(triggers[0].subscriptionId.toString()).toStrictEqual(subId);
    expect(triggers[0].correlationKey).toStrictEqual(correlationKey);
  });

  it('Triggers a subscription ready to be triggered', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );
    jest.setSystemTime(Date.now() + subCooldown * 1000 * 2);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Triggers a subscription ready to be triggered (exact clock)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );
    jest.setSystemTime(Date.now() + subCooldown * 1000);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Triggers a subscription ready to be triggered (exact clock +1)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );
    jest.setSystemTime(Date.now() + subCooldown * 1000 + 1);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Fails to trigger a subscription not ready to be triggered (exact clock -1)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );
    jest.setSystemTime(Date.now() + subCooldown * 1000 - 1);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(false);
  });

  it('Ensures that subscription trigger cooldowns are evaluated as seconds', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const projectId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subCooldown = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      projectId,
      domain,
    );
    await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );
    jest.setSystemTime(Date.now() + subCooldown * 10 * 2);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subCooldown,
      null,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(false);

    const triggers = await triggersService.getAll();
    expect(triggers[0].subscriptionId.toString()).toStrictEqual(subId);
    expect(triggers[0].correlationKey).toStrictEqual(correlationKey);
  });

  describe('Subscription triggers for blocked resources', () => {
    it('Does not trigger a subscription ready to be triggered for a blocked domain', async () => {
      // Arrange
      const subId = '6574f560570cfc954ccf0b42';
      const projectObj = await project('name');
      const projectId = projectObj._id.toString();
      const domainName = 'example.com';
      const domainObj = await domain(projectId, domainName, true);
      const subCooldown = 100;
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        projectId,
        domainName,
      );

      await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );
      jest.setSystemTime(Date.now() + subCooldown * 1000 * 2);

      // Act
      const triggerSuccess = await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );

      // Assert
      expect(triggerSuccess).toStrictEqual(false);
    });

    it('Does not trigger a subscription ready to be triggered for a blocked host', async () => {
      // Arrange
      const subId = '6574f560570cfc954ccf0b42';
      const projectObj = await project('name');
      const projectId = projectObj._id.toString();
      const ip = '1.1.1.1';
      const hostObj = await host(projectId, ip, true);
      const subCooldown = 100;
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        projectId,
        undefined,
        ip,
      );

      await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );
      jest.setSystemTime(Date.now() + subCooldown * 1000 * 2);

      // Act
      const triggerSuccess = await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );

      // Assert
      expect(triggerSuccess).toStrictEqual(false);
    });

    it('Does not trigger a subscription ready to be triggered for a blocked port', async () => {
      // Arrange
      const subId = '6574f560570cfc954ccf0b42';
      const projectObj = await project('name');
      const projectId = projectObj._id.toString();
      const ip = '1.1.1.1';
      const portNumber = 22;
      const hostObj = await host(projectId, ip, true);
      const portObj = await port(
        projectId,
        hostObj._id.toString(),
        portNumber,
        true,
      );
      const subCooldown = 100;
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        projectId,
        undefined,
        ip,
        portNumber,
        'tcp',
      );

      await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );
      jest.setSystemTime(Date.now() + subCooldown * 1000 * 2);

      // Act
      const triggerSuccess = await triggersService.attemptTrigger(
        subId,
        correlationKey,
        subCooldown,
        null,
      );

      // Assert
      expect(triggerSuccess).toStrictEqual(false);
    });
  });

  async function project(name: string): Promise<ProjectDocument> {
    return await projectService.addProject({ name: name });
  }

  async function domain(
    projectId: string,
    name: string,
    blocked: boolean = false,
  ): Promise<DomainDocument> {
    const d = await domainService.addDomain(name, projectId);
    await domainService.editDomain(d._id.toString(), { blocked: blocked });
    d.blocked = blocked;
    return d;
  }

  async function host(
    projectId: string,
    ip: string,
    blocked: boolean = false,
  ): Promise<HostDocument> {
    const h = await hostService.addHost(ip, projectId);
    await hostService.batchEdit({
      hostIds: [h._id.toString()],
      block: blocked,
    });
    h.blocked = blocked;
    return h;
  }

  async function port(
    projectId: string,
    hostId: string,
    port: number,
    blocked: boolean = false,
  ) {
    const p = await portService.addPort(hostId, projectId, port, 'tcp');
    await portService.batchEdit({
      portIds: [p._id.toString()],
      block: blocked,
    });
    p.blocked = blocked;
    return p;
  }
});
