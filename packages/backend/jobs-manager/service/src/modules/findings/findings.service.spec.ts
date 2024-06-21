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
    const firstPage = await findingsService.getAll('my-target', 1, 3);
    const secondPage = await findingsService.getAll('my-target', 2, 3);

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
    const c = await projectService.addProject({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });

    // Act
    // Assert
    await expect(
      findingsService.save(c.id, '507f1f77bcf86cd799439011', null),
    ).rejects.toThrow();
  });

  it('Save - Nonexistent job - Throws', async () => {
    // Arrange
    const c = await projectService.addProject({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });

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
      const c = await projectService.addProject({
        name: randomUUID(),
        imageType: null,
        logo: null,
      });

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
    const c = await projectService.addProject({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });

    const j = await jobsModel.create({
      projectId: c.id,
      task: 'CustomJob',
    });

    // Act
    await findingsService.save(c.id, j.id, {
      key: 'my-finding',
      name: 'My finding',
      fields: [
        {
          key: 'my-field',
          type: 'text',
          label: 'My label',
          data: 'My content',
        },
      ],
      type: 'CustomFinding',
      domainName: 'example.org',
    });

    // Assert
    const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
      c.id,
      'example.org',
    );
    const findings = await findingsService.getAll(correlationKey, 1, 100);
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
});
