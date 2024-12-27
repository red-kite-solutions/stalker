import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { HttpNotFoundException } from '../../exceptions/http.exceptions';
import { AppModule } from '../app.module';
import { Job } from '../database/jobs/models/jobs.model';
import { CorrelationKeyUtils } from '../database/reporting/correlation.utils';
import {
  CustomFinding,
  FindingTextField,
} from '../database/reporting/findings/finding.model';
import { ProjectService } from '../database/reporting/project.service';
import { CustomFindingFieldDto } from './finding.dto';
import { CustomFindingsConstants } from './findings.constants';
import { FindingsService } from './findings.service';

describe('Findings Service Spec', () => {
  let moduleFixture: TestingModule;
  let findingsService: FindingsService;
  let projectService: ProjectService;
  let findingsModel: Model<CustomFinding>;
  let jobsModel: Model<Job>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    findingsService = moduleFixture.get(FindingsService);
    projectService = moduleFixture.get(ProjectService);
    findingsModel = moduleFixture.get<Model<CustomFinding>>(
      getModelToken('finding'),
    );
    jobsModel = moduleFixture.get<Model<Job>>(getModelToken('job'));
  });

  beforeEach(async () => {
    findingsModel.deleteMany();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Get all - Should only return findings matching target', async () => {
    // Arrange
    await findingsModel.insertMany([
      {
        created: new Date(2011, 1, 1),
        correlationKey: 'my-target',
        name: 'b',
      },
      {
        created: new Date(2010, 1, 1),
        correlationKey: 'my-target',
        name: 'a',
      },
      {
        created: new Date(2022, 1, 1),
        correlationKey: 'my-other-target',
        name: 'should not be returned',
      },
      {
        created: new Date(2012, 1, 1),
        correlationKey: 'my-target',
        name: 'c',
      },
      {
        created: new Date(2014, 1, 1),
        correlationKey: 'my-target',
        name: 'e',
      },
      {
        created: new Date(2013, 1, 1),
        correlationKey: 'my-target',
        name: 'd',
      },
    ]);

    // Act
    const firstPage = await findingsService.getAll(0, 3, {
      target: 'my-target',
    });
    const secondPage = await findingsService.getAll(1, 3, {
      target: 'my-target',
    });

    // Assert
    expect(firstPage.totalRecords).toBe(5);
    expect(firstPage.items.map((x) => x.name).join('')).toBe('edc');

    expect(secondPage.totalRecords).toBe(5);
    expect(secondPage.items.map((x) => x.name).join('')).toBe('ba');
  });

  it('Save - Nonexistent project - Throws', async () => {
    // Arrange
    // Act
    // Assert
    await expect(
      findingsService.save('507f1f77bcf86cd799439011', '', null),
    ).rejects.toThrow(HttpNotFoundException);
  });

  it('Save - Nonexistent job - Throws', async () => {
    // Arrange
    const c = await project();

    // Act
    // Assert
    await expect(
      findingsService.save(c.id, '507f1f77bcf86cd799439011', null),
    ).rejects.toThrow();
  });

  it('Save - Nonexistent job - Throws', async () => {
    // Arrange
    const c = await project();

    // Act
    // Assert
    await expect(
      findingsService.save(c.id, '507f1f77bcf86cd799439011', null),
    ).rejects.toThrow();
  });

  it.each([
    [undefined, undefined, undefined],
    ['example.org', undefined, 80],
    ['example.org', '1.1.1.1', undefined],
    [undefined, undefined, 1],
  ])(
    'Save - Invalid finding correlation information - Throws',
    async (domainName: string, ip: string, port: number) => {
      // Arrange
      const c = await project();

      const j = await jobsModel.create({
        projectId: c.id,
        task: 'CustomJob',
      });

      // Act
      // Assert
      await expect(
        findingsService.save(c.id, j.id, {
          name: 'My finding',
          fields: [],
          type: 'CustomFinding',
          domainName,
          ip,
          port,
          key: 'my-finding',
        }),
      ).rejects.toThrow();
    },
  );

  it('Save - Valid findings - Returns findings', async () => {
    // Arrange
    const c = await project();

    const j = await jobsModel.create({
      projectId: c.id,
      task: 'CustomJob',
    });

    // Act

    await customDomainFinding(c.id, j.id, 'my-finding');

    // Assert
    const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
      c.id,
      'example.org',
    );
    const findings = await findingsService.getAll(0, 100, {
      target: correlationKey,
    });
    expect(findings.totalRecords).toBe(1);

    const finding = findings.items[0];
    expect(finding.key).toBe('my-finding');
    expect(finding.jobId).toBe(j.id);
    expect(finding.correlationKey).toBe(correlationKey);
    expect(finding.name).toBe('My finding');
    expect(finding.correlationKey).toBe(correlationKey);
    expect(Object.keys(finding.fields).length).toBe(1);

    expect(finding.fields[0].type).toBe('text');
    const field = finding.fields[0] as FindingTextField;
    expect(field.label).toBe('My label');
    expect(field.data).toBe('My content');
  });

  it('Get findings filtered by key - Deny list', async () => {
    // Arrange
    const c = await project();

    const j = await jobsModel.create({
      projectId: c.id,
      task: 'CustomJob',
    });

    const filteredKey = 'my-finding-1';
    const nonFilteredKey = 'my-finding-2';

    await customDomainFinding(c.id, j.id, filteredKey);
    await customDomainFinding(c.id, j.id, nonFilteredKey);

    // Act
    const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
      c.id,
      'example.org',
    );
    const findings = await findingsService.getAll(0, 100, {
      target: correlationKey,
      findingDenyList: [filteredKey],
    });

    // Assert
    expect(findings.totalRecords).toBe(1);
    const finding = findings.items[0];
    expect(finding.key).toBe(nonFilteredKey);
  });

  it('Get findings filtered by key - Deny list', async () => {
    // Arrange
    const c = await project();

    const j = await jobsModel.create({
      projectId: c.id,
      task: 'CustomJob',
    });

    const nonFilteredKey = 'my-finding-1';
    const filteredKey = 'my-finding-2';

    await customDomainFinding(c.id, j.id, filteredKey);
    await customDomainFinding(c.id, j.id, nonFilteredKey);

    // Act
    const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
      c.id,
      'example.org',
    );
    const findings = await findingsService.getAll(0, 100, {
      target: correlationKey,
      findingAllowList: [nonFilteredKey],
    });

    // Assert
    expect(findings.totalRecords).toBe(1);
    const finding = findings.items[0];
    expect(finding.key).toBe(nonFilteredKey);
  });

  it('Get latest website path finding', async () => {
    // Arrange
    const c = await project();

    const j = await jobsModel.create({
      projectId: c.id,
      task: 'CustomJob',
    });

    const f1 = await customWebsiteFinding(
      c.id,
      j.id,
      CustomFindingsConstants.WebsitePathFinding,
      'example.org',
    );
    const f2 = await customWebsiteFinding(
      c.id,
      j.id,
      CustomFindingsConstants.WebsitePathFinding,
      'example.org',
    );
    await customWebsiteFinding(
      c.id,
      j.id,
      CustomFindingsConstants.WebsitePathFinding,
      'example2.com',
    );
    await customWebsiteFinding(
      c.id,
      j.id,
      CustomFindingsConstants.WebsitePathFinding,
      'example.org',
      undefined,
      undefined,
      undefined,
      undefined,
      [
        {
          key: CustomFindingsConstants.WebsiteEndpointFieldKey,
          type: 'text',
          label: 'Endpoint',
          data: '/example/other-endpoint.html',
        },
      ],
    );

    // Act
    const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
      c.id,
      '1.1.1.1',
      443,
      'example.org',
      '/',
    );
    const endpoint = (
      await findingsService.getAll(0, 1, {
        target: correlationKey,
        fieldFilters: [
          {
            key: CustomFindingsConstants.WebsiteEndpointFieldKey,
            data: '/example/file.html',
          },
        ],
      })
    ).items[0];

    // Assert
    expect(endpoint._id.toString()).toStrictEqual(f2._id.toString());
    expect(endpoint.fields[0].data).toStrictEqual('/example/file.html');
  });

  async function customDomainFinding(
    projectId: string,
    jobId: string,
    key: string,
    domainName: string = 'example.org',
    name: string = 'My finding',
    fields: Array<CustomFindingFieldDto> = [
      {
        key: 'my-field',
        type: 'text',
        label: 'My label',
        data: 'My content',
      },
    ],
  ) {
    return await findingsService.save(projectId, jobId, {
      key,
      name,
      fields,
      type: 'CustomFinding',
      domainName,
    });
  }

  async function customWebsiteFinding(
    projectId: string,
    jobId: string,
    key: string,
    domainName: string = 'example.org',
    ip: string = '1.1.1.1',
    path: string = '/',
    port: number = 443,
    name: string = 'My finding',
    fields: Array<CustomFindingFieldDto> = [
      {
        key: CustomFindingsConstants.WebsiteEndpointFieldKey,
        type: 'text',
        label: 'Endpoint',
        data: '/example/file.html',
      },
    ],
  ) {
    return await findingsService.save(projectId, jobId, {
      key,
      name,
      fields,
      type: 'CustomFinding',
      domainName,
      ip,
      path,
      port,
      protocol: 'tcp',
    });
  }

  async function project() {
    return await projectService.addProject({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });
  }
});
