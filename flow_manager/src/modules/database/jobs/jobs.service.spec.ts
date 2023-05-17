import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { CompanyDocument } from '../reporting/company.model';
import { CompanyService } from '../reporting/company.service';
import { JobsService } from './jobs.service';
import { DomainNameResolvingJob } from './models/domain-name-resolving.model';
import { Job } from './models/jobs.model';

describe('Jobs Service', () => {
  let moduleFixture: TestingModule;
  let jobsModel: Model<Job>;
  let jobsService: JobsService;
  let companyService: CompanyService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    jobsService = moduleFixture.get(JobsService);
    companyService = moduleFixture.get(CompanyService);
    jobsModel = moduleFixture.get<Model<Job>>(getModelToken('job'));
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Get logs - No logs - Returns empty list', async () => {
    // Arrange
    // Act
    const c = await company(randomUUID());
    const j = await job(c);
    const actual = await jobsService.getLogs(j.id);

    // Assert
    expect(actual.items).toHaveLength(0);
    expect(actual.totalRecords).toBe(0);
  });

  it('Add and get logs - Existing job - Returns logs', async () => {
    // Arrange
    const c = await company(randomUUID());
    const j = await job(c);

    // Act
    await jobsService.addJobOutputLine(j.id, 3, 'C', 'debug');
    await jobsService.addJobOutputLine(j.id, 1, 'A', 'debug');
    await jobsService.addJobOutputLine(j.id, 2, 'B', 'debug');

    const actual = await jobsService.getLogs(j.id);

    // Assert
    expect(actual.totalRecords).toBe(3);
    expect(actual.items).toHaveLength(3);
    expect(actual.items[0].value).toBe('A');
    expect(actual.items[1].value).toBe('B');
    expect(actual.items[2].value).toBe('C');
  });

  async function company(name: string) {
    return await companyService.addCompany({
      name: name,
      imageType: null,
      logo: null,
    });
  }

  async function job(company: CompanyDocument) {
    return await jobsModel.create({
      companyId: company.id,
      task: DomainNameResolvingJob.name,
    });
  }
});