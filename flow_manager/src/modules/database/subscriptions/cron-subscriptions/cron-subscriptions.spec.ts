import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CompanyService } from '../../reporting/company.service';
import { DomainsService } from '../../reporting/domain/domain.service';
import { HostService } from '../../reporting/host/host.service';
import { PortService } from '../../reporting/port/port.service';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscription, JobParameter } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

describe('Cron Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let companyService: CompanyService;
  let subscriptionsService: CronSubscriptionsService;
  let domainsService: DomainsService;
  let hostsService: HostService;
  let portsService: PortService;

  const csDto: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription',
    companyId: null,
    jobParameters: [{ name: 'domainName', value: 'example.com' }],
  };

  const csDto2: CronSubscriptionDto = {
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    name: 'Test Cron Subscription2',
    companyId: null,
    jobParameters: [{ name: 'domainName', value: 'example.ca' }],
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    companyService = moduleFixture.get(CompanyService);
    subscriptionsService = moduleFixture.get(CronSubscriptionsService);
    domainsService = moduleFixture.get(DomainsService);
    hostsService = moduleFixture.get(HostService);
    portsService = moduleFixture.get(PortService);
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id.toString());
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

    it('Should delete the cron subscriptions for a company', async () => {
      // Arrange
      const cs = await subscription(csDto);
      const comp = await company('cs company');
      const csDto3: CronSubscriptionDto = {
        cronExpression: '*/5 * * * *',
        jobName: 'DomainNameResolvingJob',
        name: 'Test Cron Subscription3',
        companyId: comp._id.toString(),
        jobParameters: [{ name: 'domainName', value: 'example.io' }],
      };
      const cs3 = await subscription(csDto3);
      const cs2 = await subscription(csDto2);

      // Act
      await subscriptionsService.deleteAllForCompany(comp._id.toString());
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
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      expect(spy).toHaveBeenCalledWith(allDomainsCronSub.jobName, [
        {
          name: 'domainName',
          value: d1[0].name,
        },
        {
          name: 'companyId',
          value: c._id.toString(),
        },
      ]);
    });

    it('Should publish (5) jobs from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      expect(spy).toHaveBeenLastCalledWith(allDomainsCronSub.jobName, [
        {
          name: 'domainName',
          value: d5[0].name,
        },
        {
          name: 'companyId',
          value: c._id.toString(),
        },
      ]);
    });

    it('Should publish (5) jobs from input ALL_DOMAINS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      expect(spy).toHaveBeenLastCalledWith(allDomainsCronSub.jobName, [
        {
          name: 'domainName',
          value: d5[0].name,
        },
        {
          name: 'companyId',
          value: c._id.toString(),
        },
      ]);
    });

    it('Should publish (1) custom job from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        companyId: c._id,
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
      );
    });

    it('Should publish (5) custom job from input ALL_DOMAINS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        companyId: c._id,
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
      );
    });

    it('Should have (3) pages from (5) domains (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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

    it('Should have (2) pages from (2) domains (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('Should have (1) page from (1) domain (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      const c = await company('Test company');
      const domainName = 'example.com';

      const sub: CronSubscription = {
        name: 'independent cron subscription',
        input: 'ALL_DOMAINS',
        builtIn: true,
        companyId: c._id,
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
            name: 'companyId',
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
      const c = await company('Test company');
      allDomainsCronSub.companyId = c._id;
      allDomainsCronSub.jobParameters = [
        {
          name: 'domainName',
          value: '${domainName}',
        },
        {
          name: 'companyId',
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
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
            name: 'companyId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h1[0].ip },
        ]),
      );
    });

    it('Should publish (5) jobs from input ALL_HOSTS', async () => {
      // Arrange
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
            name: 'companyId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h5[0].ip },
        ]),
      );
    });

    it('Should publish (5) jobs from input ALL_HOSTS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
            name: 'companyId',
            value: c._id.toString(),
          },
          { name: 'targetIp', value: h5[0].ip },
        ]),
      );
    });

    it('Should publish (1) custom job from input ALL_HOSTS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        companyId: c._id,
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
      );
    });

    it('Should publish (5) custom job from input ALL_HOSTS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
        cronExpression: '* * * * *',
        jobName: 'CustomJob',
        companyId: c._id,
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
      );
    });

    it('Should have (3) pages from (5) hosts (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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

    it('Should have (2) pages from (2) hosts (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('Should have (1) page from (1) host (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
      const c = await company('Test company');
      allHostsCronSub.companyId = c._id;
      allHostsCronSub.jobParameters = tcpPortScanningJobParams.concat([
        {
          name: 'companyId',
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
      const c = await company('Test company');
      allTcpPortsCronSub.companyId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'companyId', value: c._id.toString() },
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
      expect(spy).toHaveBeenCalledWith(allTcpPortsCronSub.jobName, [
        { name: 'companyId', value: c._id.toString() },
        { name: 'targetIp', value: h1[0].ip },
        { name: 'ports', value: [p1.port] },
        { name: 'protocol', value: p1.layer4Protocol },
      ]);
    });

    it('Should publish (5) jobs from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await company('Test company');
      allTcpPortsCronSub.companyId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'companyId', value: c._id.toString() },
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
      expect(spy).toHaveBeenCalledWith(allTcpPortsCronSub.jobName, [
        { name: 'companyId', value: c._id.toString() },
        { name: 'targetIp', value: h1[0].ip },
        { name: 'ports', value: [p5.port] },
        { name: 'protocol', value: p5.layer4Protocol },
      ]);
    });

    it('Should publish (10) jobs from input ALL_TCP_PORTS with paging (pageSize=2)', async () => {
      // Arrange
      const c = await company('Test company');
      allTcpPortsCronSub.companyId = c._id;
      allTcpPortsCronSub.jobParameters = [
        { name: 'companyId', value: c._id.toString() },
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
      expect(spy).toHaveBeenLastCalledWith(allTcpPortsCronSub.jobName, [
        { name: 'companyId', value: c._id.toString() },
        { name: 'targetIp', value: h3[0].ip },
        { name: 'ports', value: [p10.port] },
        { name: 'protocol', value: p10.layer4Protocol },
      ]);
    });

    it('Should publish (1) custom job from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
      allTcpPortsCronSub.companyId = c._id;
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
      );
    });

    it('Should publish (5) custom job from input ALL_TCP_PORTS', async () => {
      // Arrange
      const c = await company('Test company');
      const customJobParams: JobParameter[] = [
        {
          name: 'companyId',
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
      allTcpPortsCronSub.companyId = c._id;
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
      );
    });
  });

  async function company(name: string) {
    return await companyService.addCompany({
      name: name,
      imageType: null,
      logo: null,
    });
  }

  async function subscription(subscription: CronSubscriptionDto) {
    return await subscriptionsService.create(subscription);
  }

  async function domain(name: string, companyId: string) {
    return await domainsService.addDomains([name], companyId);
  }

  async function host(ip: string, companyId: string) {
    return await hostsService.addHosts([ip], companyId);
  }

  async function port(port: number, hostId: string, companyId: string) {
    return await portsService.addPort(hostId, companyId, port, 'tcp');
  }
});
