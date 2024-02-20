import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AppModule } from '../../app.module';
import { HostnameCommand } from '../../findings/commands/Findings/hostname.command';
import { CustomFindingCommand } from '../../findings/commands/JobFindings/custom.command';
import {
  CreateCustomFinding,
  HostnameFinding,
  HostnameIpFinding,
  PortFinding,
} from '../../findings/findings.service';
import { ConfigService } from '../admin/config/config.service';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { ProjectService } from '../reporting/project.service';
import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import {
  EventSubscription,
  JobCondition,
  JobParameter,
} from './event-subscriptions/event-subscriptions.model';
import { SubscriptionsUtils } from './subscriptions.utils';

describe('Findings Handler Base', () => {
  let moduleFixture: TestingModule;
  let projectService: ProjectService;
  let customJobsService: CustomJobsService;
  let configService: ConfigService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    projectService = moduleFixture.get(ProjectService);
    customJobsService = moduleFixture.get(CustomJobsService);
    configService = moduleFixture.get(ConfigService);
  });

  beforeEach(async () => {
    const cjs = await customJobsService.getAll();
    for (const cj of cjs) {
      await customJobsService.delete(cj._id.toString());
    }
    const jpcs = await configService.getAllJobPodConfigs();
    for (const jpc of jpcs) {
      await configService.deleteJobPodConfig(jpc._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Validate conditions for execution', () => {
    it.each([
      [
        [
          { lhs: '', operator: 'equals', rhs: '' },
          { lhs: 'aSDf', operator: 'equals', rhs: 'aSDf' },
          {
            lhs: '${domainName}',
            operator: 'equals',
            rhs: '  ${ DoMAinnAmE  } ',
          },
          { lhs: 1, operator: 'equals', rhs: 1 },
          { lhs: true, operator: 'equals', rhs: true },
          { lhs: false, operator: 'equals', rhs: false },
          { lhs: -1, operator: 'equals', rhs: -1 },
          { lhs: 0, operator: 'equals', rhs: 0 },
          { lhs: 0, operator: 'equals', rhs: false },
          { lhs: 1, operator: 'equals', rhs: true },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'gte', rhs: 3 },
          { lhs: -5, operator: 'gte', rhs: -12 },
          { lhs: 0, operator: 'gte', rhs: 0 },
          { lhs: 1, operator: 'gte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'gt', rhs: 3 },
          { lhs: -5, operator: 'gt', rhs: -12 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'lte', rhs: 5 },
          { lhs: -12, operator: 'lte', rhs: -5 },
          { lhs: 0, operator: 'lte', rhs: 0 },
          { lhs: 1, operator: 'lte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'lt', rhs: 5 },
          { lhs: -12, operator: 'lt', rhs: -5 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains', rhs: 'asdf' },
          { lhs: 'asdf', operator: 'contains', rhs: 'sd' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'contains_i', rhs: 'aSDf' },
          { lhs: 'asdf', operator: 'contains_i', rhs: 'sd' },
          { lhs: 'asdf', operator: 'contains_i', rhs: 'SD' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'qw' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'TY' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'QW' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith', rhs: 'asdf' },
          { lhs: 'qwerty', operator: 'startsWith', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'startsWith_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'qw' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'QW' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith', rhs: 'asdf' },
          { lhs: 'qwerty', operator: 'endsWith', rhs: 'ty' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'endsWith_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'endsWith_i', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'endsWith_i', rhs: 'TY' },
        ],
      ],
      [
        [
          { lhs: '', operator: 'equals_i', rhs: '' },
          { lhs: 'aSDf', operator: 'equals_i', rhs: 'aSDf' },
          { lhs: 'AsdF', operator: 'equals_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'equals_i', rhs: 'qwerty' },
          {
            lhs: '${   domainName   }',
            operator: 'equals_i',
            rhs: '  ${DoMAinnAmE  }',
          },
        ],
      ],
    ])(
      'Hostname finding - Should be valid for execution',
      (conditions: JobCondition[]) => {
        // Arrange
        const hnFinding = new HostnameFinding();
        hnFinding.domainName = 'stalker.is';
        const hnCommand = new HostnameCommand(
          '',
          HostnameCommand.name,
          hnFinding,
        );

        // Act
        const shouldExecute = SubscriptionsUtils.shouldExecute(
          conditions,
          hnCommand,
        );

        // Assert
        expect(shouldExecute).toBe(true);
      },
    );

    it.each([
      [[{ lhs: '${ finding.field-1 }', operator: 'equals', rhs: 'Foo' }]],
      [[{ lhs: '${ field-1 }', operator: 'equals', rhs: 'Foo' }]],
    ])(
      'Custom finding - Should be valid for execution',
      (conditions: JobCondition[]) => {
        // Arrange
        const customFinding = new CreateCustomFinding();

        customFinding.fields = [
          {
            key: 'field-1',
            type: 'text',
            data: 'Foo',
            label: 'Field 1',
          },
          {
            key: 'field-2',
            type: 'text',
            data: 'Bar',
            label: 'Field 2',
          },
        ];

        const customFindingCommand = new CustomFindingCommand(
          '',
          '',
          CustomFindingCommand.name,
          customFinding,
        );

        // Act
        const shouldExecute = SubscriptionsUtils.shouldExecute(
          conditions,
          customFindingCommand,
        );

        // Assert
        expect(shouldExecute).toBe(true);
      },
    );

    it.each([
      [
        [
          { lhs: '', operator: 'equals', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'equals', rhs: 'aSDf' },
          { lhs: 1, operator: 'equals', rhs: 0 },
          { lhs: true, operator: 'equals', rhs: false },
          { lhs: false, operator: 'equals', rhs: true },
          { lhs: -1, operator: 'equals', rhs: 1 },
          { lhs: 0, operator: 'equals', rhs: 1 },
          { lhs: 1, operator: 'equals', rhs: false },
          { lhs: 0, operator: 'equals', rhs: true },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'gte', rhs: 5 },
          { lhs: -12, operator: 'gte', rhs: -5 },
          { lhs: 'asdf', operator: 'gte', rhs: 0 },
          { lhs: null, operator: 'gte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'gt', rhs: 5 },
          { lhs: -12, operator: 'gt', rhs: -5 },
          { lhs: -12, operator: null, rhs: -5 },
          { lhs: null, operator: 'gt', rhs: -5 },
          { lhs: -12, operator: 'gt', rhs: null },
          { lhs: -12, operator: 'gt', rhs: 'qwerty' },
          { lhs: true, operator: 'gt', rhs: 0 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'lte', rhs: 3 },
          { lhs: -5, operator: 'lte', rhs: -12 },
          { lhs: 'true', operator: 'lte', rhs: true },
          { lhs: false, operator: 'lte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'lt', rhs: 3 },
          { lhs: -5, operator: 'lt', rhs: -12 },
          { lhs: false, operator: 'lt', rhs: true },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains', rhs: 'qwerty' },
          { lhs: 'AsdF', operator: 'contains', rhs: 'aSDf' },
          { lhs: 'asdf', operator: 'contains', rhs: 'SD' },
          { lhs: 'asdf', operator: 'contains', rhs: 'af' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'QW' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'TY' },
          { lhs: '1234', operator: 'contains', rhs: 1234 },
          { lhs: true, operator: 'contains', rhs: 'true' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains_i', rhs: 'qwerty' },
          { lhs: 'AsdF', operator: 'contains_i', rhs: null },
          { lhs: 1234, operator: 'contains_i', rhs: 'sd' },
          { lhs: true, operator: 'contains_i', rhs: 'true' },
          { lhs: 'false', operator: 'contains_i', rhs: 0 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith', rhs: 'df' },
          { lhs: 'asdf', operator: 'startsWith', rhs: 'ASDF' },
          { lhs: 'asdf', operator: 'startsWith', rhs: 'aS' },
          { lhs: 'qwerty', operator: 'notanoperator', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith_i', rhs: 'sdf' },
          { lhs: 'AsdF', operator: 'startsWith_i', rhs: 'SDf' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'asdf' },
          { lhs: 1, operator: 'startsWith_i', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith', rhs: 'asDF' },
          { lhs: 'qwerty', operator: 'endsWith', rhs: 'Ty' },
          { lhs: '1', operator: 'endsWith', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith_i', rhs: 'asd' },
          { lhs: 'AsdF', operator: 'endsWith_i', rhs: 'aSD' },
          { lhs: true, operator: 'endsWith_i', rhs: 'true' },
          { lhs: 1, operator: 'endsWith_i', rhs: '1' },
        ],
      ],
      [
        [
          { lhs: '', operator: 'equals_i', rhs: 0 },
          { lhs: 1, operator: 'equals_i', rhs: true },
          { lhs: 'AsdF', operator: 'equals_i', rhs: 'qwerty' },
          { lhs: 'qwerty', operator: 'equals_i', rhs: 'qwerty1' },
        ],
      ],
    ])(
      'Hostname finding - Should be invalid for execution',
      (conditions: JobCondition[]) => {
        // Arrange
        const hnFinding = new HostnameFinding();
        const hnCommand = new HostnameCommand(
          '',
          HostnameCommand.name,
          hnFinding,
        );
        let shouldExecute = false;
        let atLeastOneError = false;

        // Act
        for (const c of conditions) {
          shouldExecute = SubscriptionsUtils.shouldExecute([c], hnCommand);
          if (shouldExecute) {
            atLeastOneError = true;
            console.log(
              `Error while processing condition: [${c.lhs} ${c.operator} ${c.rhs}] should be false`,
            );
          }
        }

        // Assert
        expect(atLeastOneError).toBe(false);
      },
    );
  });

  describe("Replace a finding's refered ${variable}", () => {
    it.each([
      '   ${    domainName   }     ',
      '${domainName}',
      '${domainName}  ',
      '    ${ domAINName  }',
    ])(
      'Should be replaced by the content of the finding',
      (paramValue: string) => {
        // Arrange
        const hnFinding = new HostnameFinding();
        hnFinding.domainName = 'stalker.is';
        let valueCopy = paramValue;

        // Act
        valueCopy = SubscriptionsUtils.replaceValueIfReferingToFinding(
          valueCopy,
          hnFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(hnFinding.domainName);

        // Arrange
        const hnipFinding = new HostnameIpFinding();
        hnipFinding.domainName = 'www.stalker.is';
        valueCopy = paramValue;

        // Act
        valueCopy = SubscriptionsUtils.replaceValueIfReferingToFinding(
          valueCopy,
          hnipFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(hnipFinding.domainName);
      },
    );

    it.each([
      '   ${    port   }     ',
      '${port}',
      '${port}  ',
      '    ${ port  }',
    ])(
      'Should be replaced by the content of the finding',
      (paramValue: string) => {
        // Arrange
        const hnFinding = new PortFinding();
        hnFinding.port = 1234;
        let valueCopy = [paramValue];

        // Act
        valueCopy = SubscriptionsUtils.replaceValueIfReferingToFinding(
          valueCopy,
          hnFinding,
        );

        // Assert
        expect(valueCopy[0]).toStrictEqual(hnFinding.port);
      },
    );

    it.each([
      '   ${    domainName   ',
      '{domainName}',
      '    $   { domainName  }',
      'domainName',
      '${}',
    ])(
      'Should not be replaced by the content of the finding',
      (paramValue: string) => {
        // Arrange
        const hnFinding = new HostnameFinding();
        hnFinding.domainName = 'stalker.is';
        let valueCopy = paramValue;

        // Act
        valueCopy = SubscriptionsUtils.replaceValueIfReferingToFinding(
          valueCopy,
          hnFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(paramValue);

        // Arrange
        const hnipFinding = new HostnameIpFinding();
        hnipFinding.domainName = 'www.stalker.is';
        valueCopy = paramValue;

        // Act
        valueCopy = SubscriptionsUtils.replaceValueIfReferingToFinding(
          valueCopy,
          hnipFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(paramValue);
      },
    );
  });

  describe('Get the proper job parameters for a custom job', () => {
    it('Should give the proper custom job parameters with the adequate structure and values', async () => {
      // Arrange
      const jpc = await configService.createJobPodConfig({
        name: 'jpc test findings handler',
        memoryKbytesLimit: 1024 * 10,
        milliCpuLimit: 10,
      });

      const cjName = 'fhb custom job';
      const cj = await customJobsService.create({
        name: cjName,
        code: 'print("hello")',
        type: 'code',
        language: 'python',
        jobPodConfigId: jpc._id.toString(),
      });
      const cj2 = await customJobsService.create({
        name: cjName + ' 2',
        code: 'print("hello")',
        type: 'code',
        language: 'python',
        jobPodConfigId: jpc._id.toString(),
      });

      const sub = new EventSubscription();
      sub.projectId = new Types.ObjectId('507f1f77bcf86cd799439011');
      sub.conditions = [];
      sub.finding = 'HostnameFinding';
      sub.jobName = cjName;
      const customParam = { name: 'custom-job-param', value: 'ASDF' };
      sub.jobParameters = [customParam];

      // Act
      const jobParams =
        await SubscriptionsUtils.getParametersForCustomJobSubscription(
          sub,
          null,
          customJobsService,
          configService,
        );

      // Assert
      expect(
        jobParams.some((p) => p.name === 'name' && p.value == cj.name),
      ).toStrictEqual(true);
      expect(
        jobParams.some((p) => p.name === 'code' && p.value == cj.code),
      ).toStrictEqual(true);
      expect(
        jobParams.some((p) => p.name === 'type' && p.value == cj.type),
      ).toStrictEqual(true);
      expect(
        jobParams.some((p) => p.name === 'language' && p.value == cj.language),
      ).toStrictEqual(true);
      expect(
        jobParams.some(
          (p) =>
            p.name === 'jobpodmillicpulimit' && p.value == jpc.milliCpuLimit,
        ),
      ).toStrictEqual(true);
      expect(
        jobParams.some(
          (p) =>
            p.name === 'jobpodmemorykblimit' &&
            p.value == jpc.memoryKbytesLimit,
        ),
      ).toStrictEqual(true);
      const param = jobParams.find((p) => p.name === 'customJobParameters');

      expect(
        (param.value as Array<JobParameter>).some(
          (p) => p.name === customParam.name && p.value === customParam.value,
        ),
      ).toStrictEqual(true);
    });
  });

  describe('Parse the yaml to make a subscription', () => {
    it('Should return a CronSubscription', async () => {
      // Arrange
      const cs: CronSubscription = {
        name: 'Yaml to parse',
        file: 'not a file.yaml',
        builtIn: true,
        cronExpression: '*/30 * * * * *',
        jobName: 'HostnameResolvingJob',
        jobParameters: [{ name: 'domainName', value: 'example.com' }],
        conditions: [],
      };
      let yaml = [
        `name: ${cs.name}`,
        `cronExpression: "${cs.cronExpression}"`,
        `job:`,
        `  name: ${cs.jobName}`,
        `  parameters:`,
        `    - name: ${cs.jobParameters[0].name}`,
        `      value: ${cs.jobParameters[0].value}`,
      ].join('\n');

      // Act
      const sub = SubscriptionsUtils.parseCronSubscriptionYaml(yaml);

      // Assert
      expect(sub.cronExpression).toStrictEqual(cs.cronExpression);
      expect(sub.name).toStrictEqual(cs.name);
      expect(sub.jobName).toStrictEqual(cs.jobName);
      expect(sub.jobParameters[0].value).toStrictEqual(
        cs.jobParameters[0].value,
      );
      expect(sub.jobParameters[0].name).toStrictEqual(cs.jobParameters[0].name);
    });

    it('Should return an EventSubscription', async () => {
      // Arrange
      const es: EventSubscription = {
        name: 'Http(s) server port check',
        file: 'not a file.yaml',
        cooldown: 82800,
        builtIn: true,
        finding: 'PortFinding',
        jobName: 'HttpServerCheckJob',
        jobParameters: [
          { name: 'targetIp', value: '${ip}' },
          { name: 'ports', value: ['${port}'] },
        ],
        conditions: [{ lhs: '${protocol}', operator: 'equals', rhs: 'tcp' }],
      };
      let yaml = [
        `name: ${es.name}`,
        `finding: ${es.finding}`,
        `triggerInterval: ${es.cooldown}`,
        `job:`,
        `  name: ${es.jobName}`,
        `  parameters:`,
        `    - name: ${es.jobParameters[0].name}`,
        `      value: ${es.jobParameters[0].value}`,
        `    - name: ${es.jobParameters[1].name}`,
        `      value:`,
        `        - ${es.jobParameters[1].value}`,
        `conditions:`,
        `  - lhs: ${es.conditions[0].lhs}`,
        `    operator: ${es.conditions[0].operator}`,
        `    rhs: ${es.conditions[0].rhs}`,
      ].join('\n');

      // Act
      const sub = SubscriptionsUtils.parseEventSubscriptionYaml(yaml);

      // Assert
      expect(sub.finding).toStrictEqual(es.finding);
      expect(sub.name).toStrictEqual(es.name);
      expect(sub.jobName).toStrictEqual(es.jobName);

      expect(sub.jobParameters[0].name).toStrictEqual(es.jobParameters[0].name);
      expect(sub.jobParameters[0].value).toStrictEqual(
        es.jobParameters[0].value,
      );

      expect(sub.jobParameters[1].name).toStrictEqual(es.jobParameters[1].name);
      expect(sub.jobParameters[1].value[0]).toStrictEqual(
        es.jobParameters[1].value[0],
      );

      expect(sub.conditions[0].lhs).toStrictEqual(es.conditions[0].lhs);
      expect(sub.conditions[0].operator).toStrictEqual(
        es.conditions[0].operator,
      );
      expect(sub.conditions[0].rhs).toStrictEqual(es.conditions[0].rhs);
    });
  });
});
