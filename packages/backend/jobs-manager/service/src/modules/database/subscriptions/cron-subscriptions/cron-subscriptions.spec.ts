import { Test, TestingModule } from '@nestjs/testing';
import {
  ipv4RangeValuesToMinMax,
  numberToIpv4,
} from '../../../../utils/ip-address.utils';
import { AppModule } from '../../../app.module';
import { DomainDocument } from '../../reporting/domain/domain.model';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostDocument } from '../../reporting/host/host.model';
import { HostService } from '../../reporting/host/host.service';
import { IpRangeService } from '../../reporting/ip-ranges/ip-range.service';
import { PortDocument } from '../../reporting/port/port.model';
import { PortService } from '../../reporting/port/port.service';
import { ProjectService } from '../../reporting/project.service';
import { WebsiteDocument } from '../../reporting/websites/website.model';
import { WebsiteService } from '../../reporting/websites/website.service';
import { JobParameter } from '../subscriptions.type';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscription } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('Cron Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let projectService: ProjectService;
  let subscriptionsService: CronSubscriptionsService;
  let domainsService: DomainsService;
  let hostsService: HostService;
  let portsService: PortService;
  let websiteService: WebsiteService;
  let ipRangeService: IpRangeService;

  const csDto: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription',
    projectId: null,
    jobParameters: [{ name: 'domainName', value: 'example.com' }],
  };

  const csDto2: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription2',
    projectId: null,
    jobParameters: [{ name: 'domainName', value: 'example.ca' }],
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    projectService = moduleFixture.get(ProjectService);
    subscriptionsService = moduleFixture.get(CronSubscriptionsService);
    domainsService = moduleFixture.get(DomainsService);
    hostsService = moduleFixture.get(HostService);
    portsService = moduleFixture.get(PortService);
    websiteService = moduleFixture.get(WebsiteService);
    ipRangeService = moduleFixture.get(IpRangeService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id.toString());
    }
    const allSubs = await subscriptionsService.getAll();
    for (const s of allSubs) {
      await subscriptionsService.delete(s._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Cron subscriptions management', () => {
    it('Should create a cron subscription', async () => {
      // Arrange & Act
      const cs = await subscription(csDto);

      // Assert
      expect(cs.name).toStrictEqual(csDto.name);
    });

    it('Should update a cron subscription', async () => {
      // Arrange
      const cs = await subscription(csDto);

      // Act
      const newCs = await subscriptionsService.edit(cs._id.toString(), {
        ...csDto,
        name: csDto2.name,
      });
      const css = await subscriptionsService.getAll();

      // Assert
      expect(newCs.modifiedCount).toStrictEqual(1);
      expect(css[0].name).toStrictEqual(csDto2.name);
    });

    it('Should get all the cron subscriptions', async () => {
      // Arrange
      const cs = await subscription(csDto);
      const cs2 = await subscription(csDto2);

      // Act
      const subs = await subscriptionsService.getAll();

      // Assert
      expect(subs[0].name).toStrictEqual(cs.name);
      expect(subs[1].name).toStrictEqual(cs2.name);
    });

    it('Should delete the cron subscriptions for a project', async () => {
      // Arrange
      const cs = await subscription(csDto);
      const comp = await project('cs project');
      const csDto3: CronSubscriptionDto = {
        cronExpression: '*/5 * * * *',
        jobName: 'DomainNameResolvingJob',
        name: 'Test Cron Subscription3',
        projectId: comp._id.toString(),
        jobParameters: [{ name: 'domainName', value: 'example.io' }],
      };
      const cs3 = await subscription(csDto3);
      const cs2 = await subscription(csDto2);

      // Act
      await subscriptionsService.deleteAllForProject(comp._id.toString());
      const subs = await subscriptionsService.getAll();

      // Assert
      expect(subs.length).toStrictEqual(2);
      expect(subs[0].name).toStrictEqual(cs.name);
      expect(subs[1].name).toStrictEqual(cs2.name);
    });
  });

  describe('Cron subscriptions ALL_* input values', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
      jest.restoreAllMocks();

      //@ts-expect-error
      subscriptionsService.publishJob = () => {};
    });

    // ALL_DOMAINS
    const allDomainsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all domains',
      input: 'ALL_DOMAINS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'DomainNameResolvingJob',
      conditions: [],
    };

    it('Should publish (1) job from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];

      const d1 = await domain('example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        allDomainsCronSub.jobName,
        [
          {
            name: 'domainName',
            value: d1[0].name,
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];
      const d1 = await domain('1.example.com', c._id.toString());
      const d2 = await domain('2.example.com', c._id.toString());
      const d3 = await domain('3.example.com', c._id.toString());
      const d4 = await domain('4.example.com', c._id.toString());
      const d5 = await domain('5.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenLastCalledWith(
        allDomainsCronSub.jobName,
        [
          {
            name: 'domainName',
            value: d5[0].name,
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_DOMAINS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];
      const d1 = await domain('1.example.com', c._id.toString());
      const d2 = await domain('2.example.com', c._id.toString());
      const d3 = await domain('3.example.com', c._id.toString());
      const d4 = await domain('4.example.com', c._id.toString());
      const d5 = await domain('5.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenLastCalledWith(
        allDomainsCronSub.jobName,
        [
          {
            name: 'domainName',
            value: d5[0].name,
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (1) custom job from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      const sub: CronSubscription = {
        name: 'test subscription all domains',
        input: 'ALL_DOMAINS',
        builtIn: true,
        isEnabled: true,
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        projectId: c._id,
        conditions: [],
        jobParameters: customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [{ name: 'domainName', value: '${domainName}' }],
          },
        ]),
      };

      const d1 = await domain('example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(sub, c._id.toString());

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        sub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [{ name: 'domainName', value: d1[0].name }],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) custom job from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      const sub: CronSubscription = {
        name: 'test subscription all domains',
        input: 'ALL_DOMAINS',
        builtIn: true,
        isEnabled: true,
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        projectId: c._id,
        conditions: [],
        jobParameters: customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'random', value: 'param' },
              { name: 'domainName', value: '${domainName}' },
              { name: 'random2', value: 'param2' },
            ],
          },
        ]),
      };

      const d1 = await domain('1.example.com', c._id.toString());
      const d2 = await domain('2.example.com', c._id.toString());
      const d3 = await domain('3.example.com', c._id.toString());
      const d4 = await domain('4.example.com', c._id.toString());
      const d5 = await domain('5.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(sub, c._id.toString());

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenLastCalledWith(
        sub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'random', value: 'param' },
              { name: 'domainName', value: d5[0].name },
              { name: 'random2', value: 'param2' },
            ],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should have (3) pages from (5) domains (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];
      const d1 = await domain('1.example.com', c._id.toString());
      const d2 = await domain('2.example.com', c._id.toString());
      const d3 = await domain('3.example.com', c._id.toString());
      const d4 = await domain('4.example.com', c._id.toString());
      const d5 = await domain('5.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromDomainsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('Should have (1) page from (2) domains (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];
      const d1 = await domain('1.example.com', c._id.toString());
      const d2 = await domain('2.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromDomainsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should have (1) page from (1) domain (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];
      const d1 = await domain('1.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromDomainsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allDomainsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should publish a job from input ALL_DOMAINS (condition=true)', async () => {
      // Arrange
      const c = await project('Test project');
      const domainName = 'example.com';

      const sub: CronSubscription = {
        name: 'independent cron subscription',
        input: 'ALL_DOMAINS',
        builtIn: true,
        isEnabled: true,
        projectId: c._id,
        cronExpression: '* * * * *',
        jobName: 'DomainNameResolvingJob',
        conditions: [
          {
            lhs: '${domainName}',
            operator: 'equals',
            rhs: domainName,
          },
        ],
        jobParameters: [
          {
            name: 'domainName',
            value: '${domainName}',
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ],
      };

      const d1 = await domain(domainName, c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob');

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(sub, c._id.toString());

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('Should not publish a job from input ALL_DOMAINS (condition=false)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];

      const d1 = await domain('asdf.example.com', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>{
          ...allDomainsCronSub,
          name: 'randomname',
          conditions: [
            {
              lhs: '${domainName}',
              operator: 'equals',
              rhs: 'notequals',
            },
          ],
        },
        c._id.toString(),
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('Should not publish a job from input ALL_DOMAINS (blocked domain)', async () => {
      // Arrange
      const c = await project('Test project');
      allDomainsCronSub.projectId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'projectId',
          value: c._id.toString(),
        },
      ];

      const d1 = await domain('asdf.example.com', c._id.toString(), true);

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>{
          ...allDomainsCronSub,
          name: 'randomname',
        },
        c._id.toString(),
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    // ALL_HOSTS
    const tcpPortScanningJobParams: JobParameter[] = [
      {
        name: 'threads',
        value: 10,
      },
      {
        name: 'socketTimeoutSeconds',
        value: 1,
      },
      {
        name: 'portMin',
        value: 1,
      },
      {
        name: 'portMax',
        value: 1000,
      },
      {
        name: 'ports',
        value: [3000, 3389, 8080],
      },
    ];
    const allHostsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all hosts',
      input: 'ALL_HOSTS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'TcpPortScanningJob',
      conditions: [],
    };

    it('Should publish (1) job from input ALL_HOSTS', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        allHostsCronSub.jobName,
        tcpPortScanningJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h1[0].ip },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_HOSTS', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const h3 = await host('1.1.1.3', c._id.toString());
      const h4 = await host('1.1.1.4', c._id.toString());
      const h5 = await host('1.1.1.5', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith(
        allHostsCronSub.jobName,
        tcpPortScanningJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h5[0].ip },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_HOSTS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const h3 = await host('1.1.1.3', c._id.toString());
      const h4 = await host('1.1.1.4', c._id.toString());
      const h5 = await host('1.1.1.5', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith(
        allHostsCronSub.jobName,
        tcpPortScanningJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h5[0].ip },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (1) custom job from input ALL_HOSTS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      const sub: CronSubscription = {
        name: 'test subscription all hosts',
        input: 'ALL_HOSTS',
        builtIn: true,
        isEnabled: true,
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        projectId: c._id,
        conditions: [],
        jobParameters: customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [{ name: 'ip', value: '${ip}' }],
          },
        ]),
      };

      const h1 = await host('1.1.1.1', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(sub, c._id.toString());

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        sub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [{ name: 'ip', value: h1[0].ip }],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) custom job from input ALL_HOSTS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      const sub: CronSubscription = {
        name: 'test subscription all hosts',
        input: 'ALL_HOSTS',
        builtIn: true,
        isEnabled: true,
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        projectId: c._id,
        conditions: [],
        jobParameters: customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'random', value: 'param' },
              { name: 'ip', value: '${ip}' },
              { name: 'random2', value: 'param2' },
            ],
          },
        ]),
      };

      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const h3 = await host('1.1.1.3', c._id.toString());
      const h4 = await host('1.1.1.4', c._id.toString());
      const h5 = await host('1.1.1.5', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(sub, c._id.toString());

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenLastCalledWith(
        sub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'random', value: 'param' },
              { name: 'ip', value: h5[0].ip },
              { name: 'random2', value: 'param2' },
            ],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should have (3) pages from (5) hosts (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const h3 = await host('1.1.1.3', c._id.toString());
      const h4 = await host('1.1.1.4', c._id.toString());
      const h5 = await host('1.1.1.5', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromHostsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('Should have (1) page from (2) hosts (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);
      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromHostsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should have (1) page from (1) host (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);
      const h1 = await host('1.1.1.1', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromHostsPage') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allHostsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Should not publish job from input ALL_HOSTS (condition=false)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>{
          ...allHostsCronSub,
          conditions: [
            {
              lhs: '${domainName}',
              operator: 'equals',
              rhs: 'notequal',
            },
          ],
        },
        c._id.toString(),
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('Should publish job from input ALL_HOSTS (condition=true)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>{
          ...allHostsCronSub,
          conditions: [
            {
              lhs: '${ip}',
              operator: 'equals',
              rhs: '1.1.1.1',
            },
          ],
        },
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('Should not publish job from input ALL_HOSTS (blocked host)', async () => {
      // Arrange
      const c = await project('Test project');
      allHostsCronSub.projectId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString(), true);

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>{
          ...allHostsCronSub,
        },
        c._id.toString(),
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    // ALL_TCP_PORTS
    const allTcpPortsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all tcp ports',
      input: 'ALL_TCP_PORTS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'HttpServerCheckJob',
      conditions: [],
    };

    it('Should publish (1) job from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await project('Test project');
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'ports', value: ['${port}'] },
        { name: 'protocol', value: '${protocol}' },
      ];

      const h1 = await host('1.1.1.1', c._id.toString());
      const p1 = await port(80, h1[0]._id.toString(), c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        allTcpPortsCronSub.jobName,
        [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: h1[0].ip },
          { name: 'ports', value: [p1.port] },
          { name: 'protocol', value: p1.layer4Protocol },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await project('Test project');
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'ports', value: ['${port}'] },
        { name: 'protocol', value: '${protocol}' },
      ];
      const h1 = await host('1.1.1.1', c._id.toString());
      await port(80, h1[0]._id.toString(), c._id.toString());
      await port(81, h1[0]._id.toString(), c._id.toString());
      await port(82, h1[0]._id.toString(), c._id.toString());
      await port(83, h1[0]._id.toString(), c._id.toString());
      const p5 = await port(84, h1[0]._id.toString(), c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith(
        allTcpPortsCronSub.jobName,
        [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: h1[0].ip },
          { name: 'ports', value: [p5.port] },
          { name: 'protocol', value: p5.layer4Protocol },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (10) jobs from input ALL_TCP_PORTS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await project('Test project');
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'ports', value: ['${port}'] },
        { name: 'protocol', value: '${protocol}' },
      ];
      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      const h3 = await host('1.1.1.3', c._id.toString());
      await port(80, h1[0]._id.toString(), c._id.toString());
      await port(81, h1[0]._id.toString(), c._id.toString());
      await port(82, h1[0]._id.toString(), c._id.toString());
      await port(83, h2[0]._id.toString(), c._id.toString());
      await port(84, h2[0]._id.toString(), c._id.toString());
      await port(80, h2[0]._id.toString(), c._id.toString());
      await port(81, h3[0]._id.toString(), c._id.toString());
      await port(82, h3[0]._id.toString(), c._id.toString());
      await port(83, h3[0]._id.toString(), c._id.toString());
      const p10 = await port(84, h3[0]._id.toString(), c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
        2,
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(10);
      expect(spy).toHaveBeenLastCalledWith(
        allTcpPortsCronSub.jobName,
        [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: h3[0].ip },
          { name: 'ports', value: [p10.port] },
          { name: 'protocol', value: p10.layer4Protocol },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (1) custom job from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      allTcpPortsCronSub.jobName = 'CustomJob';
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = customJobParams.concat([
        {
          name: 'customJobParameters',
          value: [
            { name: 'targetIp', value: '${ip}' },
            { name: 'ports', value: ['${port}'] },
            { name: 'protocol', value: '${protocol}' },
          ],
        },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());
      const p1 = await port(80, h1[0]._id.toString(), c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        allTcpPortsCronSub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'targetIp', value: h1[0].ip },
              { name: 'ports', value: [p1.port] },
              { name: 'protocol', value: p1.layer4Protocol },
            ],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) custom job from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];

      allTcpPortsCronSub.jobName = 'CustomJob';
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = customJobParams.concat([
        {
          name: 'customJobParameters',
          value: [
            { name: 'targetIp', value: '${ip}' },
            { name: 'ports', value: ['${port}'] },
            { name: 'protocol', value: '${protocol}' },
          ],
        },
      ]);

      const h1 = await host('1.1.1.1', c._id.toString());
      const h2 = await host('1.1.1.2', c._id.toString());
      await port(80, h1[0]._id.toString(), c._id.toString());
      await port(81, h1[0]._id.toString(), c._id.toString());
      await port(82, h1[0]._id.toString(), c._id.toString());
      await port(83, h2[0]._id.toString(), c._id.toString());
      const p5 = await port(84, h2[0]._id.toString(), c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation((x, y) => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenLastCalledWith(
        allTcpPortsCronSub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'targetIp', value: h2[0].ip },
              { name: 'ports', value: [p5.port] },
              { name: 'protocol', value: p5.layer4Protocol },
            ],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should not publish a job from input ALL_TCP_PORTS (blocked port)', async () => {
      // Arrange
      const c = await project('Test project');
      allTcpPortsCronSub.projectId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'ports', value: ['${port}'] },
        { name: 'protocol', value: '${protocol}' },
      ];

      const h1 = await host('1.1.1.1', c._id.toString());
      const p1 = await port(80, h1[0]._id.toString(), c._id.toString(), true);

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allTcpPortsCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    // ALL_IP_RANGES
    const ipRangeScanCronSub: Partial<CronSubscription> = {
      name: 'test subscription scan ranges',
      input: 'ALL_IP_RANGES',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'TcpIpRangeScanningJob',
      conditions: [],
    };

    it('Should publish (1) job from input ALL_IP_RANGES', async () => {
      // Arrange
      const c = await project('Test project');
      const ip = '1.1.1.1';
      const mask = 32;
      ipRangeScanCronSub.projectId = c._id;
      ipRangeScanCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'targetMask', value: '${mask}' },
        { name: 'rate', value: 100000 },
        { name: 'portMin', value: 1 },
        { name: 'portMax', value: 1000 },
        { name: 'ports', value: [] },
      ];

      await ipRangeService.addIpRange(ip, mask, c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>ipRangeScanCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        ipRangeScanCronSub.jobName,
        [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: ip },
          { name: 'targetMask', value: mask },
          { name: 'rate', value: 100000 },
          { name: 'portMin', value: 1 },
          { name: 'portMax', value: 1000 },
          { name: 'ports', value: [] },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_IP_RANGES', async () => {
      // Arrange
      const c = await project('Test project');
      const ip = '1.1.1.1';
      const mask = 32;
      ipRangeScanCronSub.projectId = c._id;
      ipRangeScanCronSub.jobParameters = [
        { name: 'projectId', value: c._id.toString() },
        { name: 'targetIp', value: '${ip}' },
        { name: 'targetMask', value: '${mask}' },
        { name: 'rate', value: 100000 },
        { name: 'portMin', value: 1 },
        { name: 'portMax', value: 1000 },
        { name: 'ports', value: [] },
      ];

      await ipRangeService.addIpRange('1.1.1.2', mask, c._id.toString());
      await ipRangeService.addIpRange('1.1.1.3', mask, c._id.toString());
      await ipRangeService.addIpRange('1.1.1.4', mask, c._id.toString());
      await ipRangeService.addIpRange('1.1.1.5', mask, c._id.toString());
      await ipRangeService.addIpRange(ip, mask, c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>ipRangeScanCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenLastCalledWith(
        ipRangeScanCronSub.jobName,
        [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: ip },
          { name: 'targetMask', value: mask },
          { name: 'rate', value: 100000 },
          { name: 'portMin', value: 1 },
          { name: 'portMax', value: 1000 },
          { name: 'ports', value: [] },
        ],
        c._id.toString(),
      );
    });

    it('Should publish (1) custom job from input ALL_IP_RANGES', async () => {
      // Arrange
      const c = await project('Test project');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];
      const ip = '1.1.1.1';
      const mask = 32;
      ipRangeScanCronSub.jobName = 'CustomJob';
      ipRangeScanCronSub.projectId = c._id;
      ipRangeScanCronSub.jobParameters = customJobParams.concat([
        {
          name: 'customJobParameters',
          value: [
            { name: 'targetIp', value: '${ip}' },
            { name: 'targetMask', value: '${mask}' },
          ],
        },
      ]);

      await ipRangeService.addIpRange(ip, mask, c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>ipRangeScanCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenLastCalledWith(
        ipRangeScanCronSub.jobName,
        customJobParams.concat([
          {
            name: 'customJobParameters',
            value: [
              { name: 'targetIp', value: ip },
              { name: 'targetMask', value: mask },
            ],
          },
        ]),
        c._id.toString(),
      );
    });

    it('Should start publishing for two projects from input ALL_IP_RANGES', async () => {
      // Arrange
      const c = await project('Test project');
      const c2 = await project('project 2');
      const customJobParams: JobParameter[] = [
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'name', value: 'Custom job name' },
        { name: 'code', value: 'print("hello world")' },
        { name: 'type', value: 'code' },
        {
          name: 'jobpodmemorykblimit',
          value: 500,
        },
        {
          name: 'jobpodmillicpulimit',
          value: 500,
        },
      ];
      const ip = '1.1.1.1';
      const mask = 32;
      ipRangeScanCronSub.projectId = undefined;
      ipRangeScanCronSub.jobName = 'CustomJob';
      ipRangeScanCronSub.jobParameters = customJobParams.concat([
        {
          name: 'customJobParameters',
          value: [
            { name: 'targetIp', value: '${ip}' },
            { name: 'targetMask', value: '${mask}' },
          ],
        },
      ]);

      await ipRangeService.addIpRange('1.1.1.2', mask, c._id.toString());
      await ipRangeService.addIpRange('1.1.1.3', mask, c._id.toString());
      await ipRangeService.addIpRange('1.1.1.4', mask, c2._id.toString());
      await ipRangeService.addIpRange('1.1.1.5', mask, c2._id.toString());
      await ipRangeService.addIpRange(ip, mask, c._id.toString());

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJobsFromInput') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.setupSubscriptionsForProjects(
        <CronSubscription>ipRangeScanCronSub,
        '',
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(2);
    });

    // ALL_WEBSITES
    const websiteCrawlingJobParams: JobParameter[] = [
      {
        name: 'crawlDurationSeconds',
        value: 1800,
      },
      {
        name: 'fetcherConcurrency',
        value: 10,
      },
      {
        name: 'inputParallelism',
        value: 10,
      },
      {
        name: 'extraOptions',
        value: '-jc -kf all -duc -j -or -ob -silent',
      },
    ];
    const allWebsitesCronSub: Partial<CronSubscription> = {
      name: 'test subscription all websites',
      input: 'ALL_WEBSITES',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'WebsiteCrawlingJob',
      conditions: [],
    };

    it('Should publish (1) job from input ALL_WEBSITES', async () => {
      // Arrange
      const c = await project('Test project');
      allWebsitesCronSub.projectId = c._id;
      allWebsitesCronSub.jobParameters = websiteCrawlingJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
        { name: 'domainName', value: '${domainName}' },
        { name: 'port', value: '${port}' },
        { name: 'path', value: '${path}' },
        { name: 'ssl', value: '${ssl}' },
      ]);

      const w1 = await website(c._id.toString(), '1.1.1.1', 80, 'example.com');

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allWebsitesCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        allWebsitesCronSub.jobName,
        websiteCrawlingJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: '1.1.1.1' },
          { name: 'domainName', value: 'example.com' },
          { name: 'port', value: 80 },
          { name: 'path', value: '/' },
          { name: 'ssl', value: false },
        ]),
        c._id.toString(),
      );
    });

    it('Should publish (5) jobs from input ALL_WEBSITES', async () => {
      // Arrange
      const c = await project('Test project');
      allWebsitesCronSub.projectId = c._id;
      allWebsitesCronSub.jobParameters = websiteCrawlingJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
        { name: 'domainName', value: '${domainName}' },
        { name: 'port', value: '${port}' },
        { name: 'path', value: '${path}' },
        { name: 'ssl', value: '${ssl}' },
      ]);

      const w1 = await website(c._id.toString(), '1.1.1.1', 80, 'example.com');
      const w2 = await website(c._id.toString(), '1.1.1.2', 80, 'example.com');
      const w3 = await website(c._id.toString(), '1.1.1.3', 80, 'example.com');
      const w4 = await website(c._id.toString(), '1.1.1.4', 80, 'example.com');
      const w5 = await website(c._id.toString(), '1.1.1.5', 80, 'example.com');

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allWebsitesCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith(
        allWebsitesCronSub.jobName,
        websiteCrawlingJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: '1.1.1.5' },
          { name: 'domainName', value: 'example.com' },
          { name: 'port', value: 80 },
          { name: 'path', value: '/' },
          { name: 'ssl', value: false },
        ]),
        c._id.toString(),
      );
    });

    it('Should not publish job from input ALL_WEBSITES (merged website)', async () => {
      // Arrange
      const c = await project('Test project');
      allWebsitesCronSub.projectId = c._id;
      allWebsitesCronSub.jobParameters = websiteCrawlingJobParams.concat([
        {
          name: 'projectId',
          value: c._id.toString(),
        },
        { name: 'targetIp', value: '${ip}' },
        { name: 'domainName', value: '${domainName}' },
        { name: 'port', value: '${port}' },
        { name: 'path', value: '${path}' },
        { name: 'ssl', value: '${ssl}' },
      ]);

      const w1 = await website(c._id.toString(), '1.1.1.1', 80, 'example.com');
      const w2 = await website(c._id.toString(), '1.1.1.2', 80, 'example.com');
      const w3 = await website(c._id.toString(), '1.1.1.3', 80, 'example.com');
      const w4 = await website(c._id.toString(), '1.1.1.4', 80, 'example.com');
      const w5 = await website(c._id.toString(), '1.1.1.5', 80, 'example.com');

      await websiteService.merge(w5._id.toString(), [
        w1._id.toString(),
        w2._id.toString(),
        w3._id.toString(),
        w4._id.toString(),
      ]);

      const spy = jest //@ts-expect-error
        .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
        .mockImplementation(() => {});

      // Act
      //@ts-expect-error
      await subscriptionsService.publishJobsFromInput(
        <CronSubscription>allWebsitesCronSub,
        c._id.toString(),
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        allWebsitesCronSub.jobName,
        websiteCrawlingJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: '1.1.1.5' },
          { name: 'domainName', value: 'example.com' },
          { name: 'port', value: 80 },
          { name: 'path', value: '/' },
          { name: 'ssl', value: false },
        ]),
        c._id.toString(),
      );
    });
  });

  describe('Duplicate', () => {
    it('Should get rid of the source when duplicating', async () => {
      // Arrange
      const subData: CronSubscriptionDto = {
        projectId: '',
        name: 'my sub',
        jobName: 'DomainNameResolvingJob',
        cronExpression: '* * * * *',
      };

      const sub = await subscription({
        ...subData,
      });

      // Act
      await subscriptionsService.duplicate(sub.id);

      // Assert
      const subs = await subscriptionsService.getAll();
      expect(subs.length).toStrictEqual(2);

      const [original, duplicate] = subs;
      expect(duplicate.source).toBeUndefined();
      expect(duplicate.name).toEqual(`${original.name} Copy`);
      expect(duplicate.isEnabled).toEqual(original.isEnabled);
      expect(duplicate.projectId).toEqual(original.projectId);
      expect(duplicate.jobName).toEqual(original.jobName);
      expect(duplicate.jobParameters).toEqual(original.jobParameters);
      expect(duplicate.conditions).toEqual(original.conditions);
      expect(duplicate.builtIn).toEqual(original.builtIn);
      expect(duplicate.file).toEqual(original.file);
      expect(duplicate.cronExpression).toEqual(original.cronExpression);
    });
  });

  describe('Cron subscription batching jobs', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
      jest.restoreAllMocks();

      //@ts-expect-error
      subscriptionsService.publishJob = () => {};
    });

    // ALL_DOMAINS
    const allDomainsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all domains',
      input: 'ALL_DOMAINS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'DomainNameResolvingJob',
      conditions: [],
    };

    it.each([
      {
        batchEnabled: true,
        batchSize: undefined,
        domains: ['www.example.com'],
      },
      {
        batchEnabled: true,
        batchSize: undefined,
        domains: ['www.example.com', 'example.com', 'other.example.com'],
      },
      {
        batchEnabled: true,
        batchSize: 3,
        domains: ['www.example.com', 'example.com', 'other.example.com'],
      },
      {
        batchEnabled: true,
        batchSize: 100,
        domains: ['www.example.com', 'example.com', 'other.example.com'],
      },
    ])(
      'Should publish jobs from input ALL_DOMAINS (one batch)',
      async ({ batchEnabled, batchSize, domains }) => {
        // Arrange
        const c = await project('Test project');
        allDomainsCronSub.projectId = c._id;
        allDomainsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        allDomainsCronSub.jobParameters = [
          {
            name: 'domainNames',
            value: '${domainBatch}',
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ];

        const domainObjects: DomainDocument[] = [];
        for (const d of domains) {
          domainObjects.push(...(await domain(d, c._id.toString())));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allDomainsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          allDomainsCronSub.jobName,
          [
            {
              name: 'domainNames',
              value: domainObjects.map((d) => d.name),
            },
            {
              name: 'projectId',
              value: c._id.toString(),
            },
          ],
          c._id.toString(),
        );
      },
    );

    it.each([
      {
        batchEnabled: true,
        batchSize: 1,
        domains: ['www.example.com', 'example.com', 'other.example.com'],
        expectedCalls: 3,
      },
      {
        batchEnabled: true,
        batchSize: 2,
        domains: ['www.example.com', 'example.com', 'other.example.com'],
        expectedCalls: 2,
      },
    ])(
      'Should publish jobs from input ALL_DOMAINS (multiple batches)',
      async ({ batchEnabled, batchSize, domains, expectedCalls }) => {
        // Arrange
        const c = await project('Test project');
        allDomainsCronSub.projectId = c._id;
        allDomainsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        allDomainsCronSub.jobParameters = [
          {
            name: 'domainNames',
            value: '${domainBatch}',
          },
          {
            name: 'projectId',
            value: c._id.toString(),
          },
        ];

        const domainObjects: DomainDocument[] = [];
        for (const d of domains) {
          domainObjects.push(...(await domain(d, c._id.toString())));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allDomainsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalledTimes(expectedCalls);
      },
    );

    // ALL_HOSTS
    const tcpPortScanningJobParams: JobParameter[] = [
      {
        name: 'threads',
        value: 10,
      },
      {
        name: 'socketTimeoutSeconds',
        value: 1,
      },
      {
        name: 'portMin',
        value: 1,
      },
      {
        name: 'portMax',
        value: 1000,
      },
      {
        name: 'ports',
        value: [3000, 3389, 8080],
      },
    ];

    const allHostsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all hosts',
      input: 'ALL_HOSTS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'TcpPortScanningJob',
      conditions: [],
    };

    it.each([
      {
        batchEnabled: true,
        batchSize: undefined,
        ips: ['1.1.1.1'],
      },
      {
        batchEnabled: true,
        batchSize: undefined,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
      },
      {
        batchEnabled: true,
        batchSize: 3,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
      },
      {
        batchEnabled: true,
        batchSize: 100,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
      },
    ])(
      'Should publish jobs from input ALL_HOSTS (one batch)',
      async ({ batchEnabled, batchSize, ips }) => {
        // Arrange
        const c = await project('Test project');
        allHostsCronSub.projectId = c._id;
        allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: '${ipBatch}' },
        ]);
        allHostsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        const allHosts: HostDocument[] = [];
        for (const ip of ips) {
          allHosts.push(...(await host(ip, c._id.toString())));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allHostsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          allHostsCronSub.jobName,
          tcpPortScanningJobParams.concat([
            {
              name: 'projectId',
              value: c._id.toString(),
            },
            { name: 'targetIp', value: allHosts.map((h) => h.ip) },
          ]),
          c._id.toString(),
        );
      },
    );

    it.each([
      {
        batchEnabled: true,
        batchSize: 1,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        expectedCalls: 3,
      },
      {
        batchEnabled: true,
        batchSize: 2,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        expectedCalls: 2,
      },
    ])(
      'Should publish jobs from input ALL_HOSTS (multiple batches)',
      async ({ batchEnabled, batchSize, ips, expectedCalls }) => {
        // Arrange
        const c = await project('Test project');
        allHostsCronSub.projectId = c._id;
        allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: '${ipBatch}' },
        ]);
        allHostsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        const allHosts: HostDocument[] = [];
        for (const ip of ips) {
          allHosts.push(...(await host(ip, c._id.toString())));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allHostsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalledTimes(expectedCalls);
      },
    );

    // ALL_TCP_PORTS
    const allTcpPortsCronSub: Partial<CronSubscription> = {
      name: 'test subscription all tcp ports',
      input: 'ALL_TCP_PORTS',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'HttpServerCheckJob',
      conditions: [],
    };

    it.each([
      {
        batchEnabled: true,
        batchSize: undefined,
        ports: [22],
      },
      {
        batchEnabled: true,
        batchSize: undefined,
        ports: [22, 80, 443],
      },
      {
        batchEnabled: true,
        batchSize: 3,
        ports: [22, 80, 443],
      },
      {
        batchEnabled: true,
        batchSize: 100,
        ports: [22, 80, 443],
      },
    ])(
      'Should publish job from input ALL_TCP_PORTS (one batch)',
      async ({ batchEnabled, batchSize, ports }) => {
        // Arrange
        const c = await project('Test project');
        allTcpPortsCronSub.projectId = c._id;
        allTcpPortsCronSub.jobParameters = [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: '${ipBatch}' },
          { name: 'ports', value: '${portBatch}' },
          { name: 'protocol', value: '${protocolBatch}' },
        ];
        allTcpPortsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        const h1 = await host('1.1.1.1', c._id.toString());

        const allPorts: PortDocument[] = [];
        for (const p of ports) {
          allPorts.push(await port(p, h1[0]._id.toString(), c._id.toString()));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allTcpPortsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          allTcpPortsCronSub.jobName,
          [
            { name: 'projectId', value: c._id.toString() },
            { name: 'targetIp', value: allPorts.map((p) => p.host.ip) },
            { name: 'ports', value: allPorts.map((p) => p.port) },
            { name: 'protocol', value: allPorts.map((p) => p.layer4Protocol) },
          ],
          c._id.toString(),
        );
      },
    );

    it.each([
      {
        batchEnabled: true,
        batchSize: 1,
        ports: [22, 80, 443],
        expectedCalls: 3,
      },
      {
        batchEnabled: true,
        batchSize: 2,
        ports: [22, 80, 443],
        expectedCalls: 2,
      },
    ])(
      'Should publish job from input ALL_TCP_PORTS (multiple batches)',
      async ({ batchEnabled, batchSize, ports, expectedCalls }) => {
        // Arrange
        const c = await project('Test project');
        allTcpPortsCronSub.projectId = c._id;
        allTcpPortsCronSub.jobParameters = [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIp', value: '${ipBatch}' },
          { name: 'ports', value: '${portBatch}' },
          { name: 'protocol', value: '${protocolBatch}' },
        ];
        allTcpPortsCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        const h1 = await host('1.1.1.1', c._id.toString());

        const allPorts: PortDocument[] = [];
        for (const p of ports) {
          allPorts.push(await port(p, h1[0]._id.toString(), c._id.toString()));
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allTcpPortsCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalledTimes(expectedCalls);
      },
    );

    // ALL_IP_RANGES
    const ipRangeScanCronSub: Partial<CronSubscription> = {
      name: 'test subscription scan ranges',
      input: 'ALL_IP_RANGES',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'TcpIpRangeScanningJob',
      conditions: [],
    };

    it.each([
      {
        batchEnabled: true,
        batchSize: undefined,
        ips: ['1.1.1.1'],
        masks: [24],
      },
      {
        batchEnabled: true,
        batchSize: undefined,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        masks: [32, 24, 23],
      },
      {
        batchEnabled: true,
        batchSize: 3,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        masks: [32, 24, 23],
      },
      {
        batchEnabled: true,
        batchSize: 100,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        masks: [32, 24, 23],
      },
    ])(
      'Should publish jobs from input ALL_IP_RANGES (one batch): %s',
      async ({ batchEnabled, batchSize, ips, masks }) => {
        // Arrange
        const c = await project('Test project');
        ipRangeScanCronSub.projectId = c._id;
        ipRangeScanCronSub.jobParameters = [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIps', value: '${ipBatch}' },
          { name: 'targetMasks', value: '${maskBatch}' },
          { name: 'rate', value: 100000 },
          { name: 'portMin', value: 1 },
          { name: 'portMax', value: 1000 },
          { name: 'ports', value: [] },
        ];

        ipRangeScanCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        for (let i = 0; i < ips.length; ++i) {
          await ipRangeService.addIpRange(ips[i], masks[i], c._id.toString());
          ips[i] = numberToIpv4(ipv4RangeValuesToMinMax(ips[i], masks[i]).min);
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>ipRangeScanCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          ipRangeScanCronSub.jobName,
          [
            { name: 'projectId', value: c._id.toString() },
            { name: 'targetIps', value: ips },
            { name: 'targetMasks', value: masks },
            { name: 'rate', value: 100000 },
            { name: 'portMin', value: 1 },
            { name: 'portMax', value: 1000 },
            { name: 'ports', value: [] },
          ],
          c._id.toString(),
        );
      },
    );

    it.each([
      {
        batchEnabled: true,
        batchSize: 1,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        masks: [32, 24, 23],
        expectedCalls: 3,
      },
      {
        batchEnabled: true,
        batchSize: 2,
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        masks: [32, 24, 23],
        expectedCalls: 2,
      },
    ])(
      'Should publish jobs from input ALL_IP_RANGES (multiple batches)',
      async ({ batchEnabled, batchSize, ips, masks, expectedCalls }) => {
        // Arrange
        const c = await project('Test project');
        ipRangeScanCronSub.projectId = c._id;
        ipRangeScanCronSub.jobParameters = [
          { name: 'projectId', value: c._id.toString() },
          { name: 'targetIps', value: '${ipBatch}' },
          { name: 'targetMasks', value: '${maskBatch}' },
          { name: 'rate', value: 100000 },
          { name: 'portMin', value: 1 },
          { name: 'portMax', value: 1000 },
          { name: 'ports', value: [] },
        ];

        ipRangeScanCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        for (let i = 0; i < ips.length; ++i) {
          await ipRangeService.addIpRange(ips[i], masks[i], c._id.toString());
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>ipRangeScanCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalledTimes(expectedCalls);
      },
    );

    // ALL_WEBSITES
    const websiteCrawlingJobParams: JobParameter[] = [
      {
        name: 'crawlDurationSeconds',
        value: 1800,
      },
      {
        name: 'fetcherConcurrency',
        value: 10,
      },
      {
        name: 'inputParallelism',
        value: 10,
      },
      {
        name: 'extraOptions',
        value: '-jc -kf all -duc -j -or -ob -silent',
      },
    ];
    const allWebsitesCronSub: Partial<CronSubscription> = {
      name: 'test subscription all websites',
      input: 'ALL_WEBSITES',
      builtIn: true,
      cronExpression: '* * * * *',
      jobName: 'WebsiteCrawlingJob',
      conditions: [],
    };

    it.each([
      {
        batchEnabled: true,
        batchSize: undefined,
        domains: ['example.com'],
        ips: ['1.1.1.1'],
        ports: [80],
        paths: ['/'],
        ssls: [false],
      },
      {
        batchEnabled: true,
        batchSize: undefined,
        domains: ['example.com', 'www.example.com', 'test.example.com'],
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        ports: [80, 443, 8080],
        paths: ['/', '/2', '/asdf'],
        ssls: [false, true, true],
      },
      {
        batchEnabled: true,
        batchSize: 3,
        domains: ['example.com', 'www.example.com', 'test.example.com'],
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        ports: [80, 443, 8080],
        paths: ['/', '/2', '/asdf'],
        ssls: [false, true, true],
      },
      {
        batchEnabled: true,
        batchSize: 100,
        domains: ['example.com', 'www.example.com', 'test.example.com'],
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        ports: [80, 443, 8080],
        paths: ['/', '/2', '/asdf'],
        ssls: [false, true, true],
      },
    ])(
      'Should publish jobs from input ALL_WEBSITES (one batch)',
      async ({ batchEnabled, batchSize, domains, ips, ports, paths, ssls }) => {
        // Arrange
        const c = await project('Test project');
        allWebsitesCronSub.projectId = c._id;
        allWebsitesCronSub.jobParameters = websiteCrawlingJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIps', value: '${ipBatch}' },
          { name: 'domainNames', value: '${domainBatch}' },
          { name: 'ports', value: '${portBatch}' },
          { name: 'paths', value: '${pathBatch}' },
          { name: 'ssls', value: '${sslBatch}' },
        ]);
        allWebsitesCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        for (let i = 0; i < ips.length; ++i) {
          await website(
            c._id.toString(),
            ips[i],
            ports[i],
            domains[i],
            paths[i],
            ssls[i],
          );
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allWebsitesCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
          allWebsitesCronSub.jobName,
          websiteCrawlingJobParams.concat([
            {
              name: 'projectId',
              value: c._id.toString(),
            },
            { name: 'targetIps', value: ips },
            { name: 'domainNames', value: domains },
            { name: 'ports', value: ports },
            { name: 'paths', value: paths },
            { name: 'ssls', value: ssls },
          ]),
          c._id.toString(),
        );
      },
    );

    it.each([
      {
        batchEnabled: true,
        batchSize: 1,
        domains: ['example.com', 'www.example.com', 'test.example.com'],
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        ports: [80, 443, 8080],
        paths: ['/', '/2', '/asdf'],
        ssls: [false, true, true],
        expectedCalls: 3,
      },
      {
        batchEnabled: true,
        batchSize: 2,
        domains: ['example.com', 'www.example.com', 'test.example.com'],
        ips: ['1.1.1.1', '2.2.2.2', '3.3.3.3'],
        ports: [80, 443, 8080],
        paths: ['/', '/2', '/asdf'],
        ssls: [false, true, true],
        expectedCalls: 2,
      },
    ])(
      'Should publish jobs from input ALL_WEBSITES (multiple batches)',
      async ({
        batchEnabled,
        batchSize,
        domains,
        ips,
        ports,
        paths,
        ssls,
        expectedCalls,
      }) => {
        // Arrange
        const c = await project('Test project');
        allWebsitesCronSub.projectId = c._id;
        allWebsitesCronSub.jobParameters = websiteCrawlingJobParams.concat([
          {
            name: 'projectId',
            value: c._id.toString(),
          },
          { name: 'targetIps', value: '${ipBatch}' },
          { name: 'domainNames', value: '${domainBatch}' },
          { name: 'ports', value: '${portBatch}' },
          { name: 'paths', value: '${pathBatch}' },
          { name: 'ssls', value: '${sslBatch}' },
        ]);
        allWebsitesCronSub.batch = {
          enabled: batchEnabled,
          size: batchSize,
        };

        for (let i = 0; i < ips.length; ++i) {
          await website(
            c._id.toString(),
            ips[i],
            ports[i],
            domains[i],
            paths[i],
            ssls[i],
          );
        }

        const spy = jest //@ts-expect-error
          .spyOn(subscriptionsService, 'publishJob') //@ts-expect-error
          .mockImplementation(() => {});

        // Act
        //@ts-expect-error
        await subscriptionsService.publishJobsFromInput(
          <CronSubscription>allWebsitesCronSub,
          c._id.toString(),
        );

        // Assert
        expect(spy).toHaveBeenCalledTimes(expectedCalls);
      },
    );
  });

  async function project(name: string) {
    return await projectService.addProject({
      name: name,
      imageType: null,
      logo: null,
    });
  }

  async function subscription(subscription: CronSubscriptionDto) {
    return await subscriptionsService.create(subscription);
  }

  async function domain(
    name: string,
    projectId: string,
    blocked: boolean = false,
  ) {
    const d = await domainsService.addDomains([name], projectId);
    if (blocked) {
      await domainsService.batchEdit({
        domainIds: [d[0]._id.toString()],
        block: true,
      });
      d[0].blocked = true;
    }
    return d;
  }

  async function host(ip: string, projectId: string, blocked: boolean = false) {
    const h = await hostsService.addHosts([ip], projectId);
    if (blocked) {
      await hostsService.batchEdit({
        hostIds: [h[0]._id.toString()],
        block: true,
      });
      h[0].blocked = true;
    }
    return h;
  }

  async function port(
    port: number,
    hostId: string,
    projectId: string,
    blocked: boolean = false,
  ) {
    const p = await portsService.addPort(hostId, projectId, port, 'tcp');
    if (blocked) {
      await portsService.batchEdit({
        portIds: [p._id.toString()],
        block: true,
      });
      p.blocked = true;
    }
    return p;
  }

  async function website(
    projectId: string,
    ip: string,
    portNumber: number,
    domainName: string,
    path = '/',
    ssl = false,
  ): Promise<WebsiteDocument> {
    const h = await host(ip, projectId);
    const p = await port(portNumber, h[0]._id, projectId);
    const d = await domain(domainName, projectId);

    return await websiteService.addWebsite(
      projectId,
      ip,
      portNumber,
      domainName,
      path,
      ssl,
    );
  }
});
