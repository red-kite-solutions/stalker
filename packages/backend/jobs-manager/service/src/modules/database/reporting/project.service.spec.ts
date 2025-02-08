import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { CustomFindingFieldDto } from '../../findings/finding.dto';
import { FindingsService } from '../../findings/findings.service';
import { Job } from '../jobs/models/jobs.model';
import { CustomFinding } from './findings/finding.model';
import { ProjectService } from './project.service';

describe('Project Service Spec', () => {
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
    await findingsModel.deleteMany({});
    const ids = await projectService.getAllIds();
    for (const id of ids) {
      await projectService.delete(id);
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Cleanup project', () => {
    it('Should preserve findings that do not belong to the deleted project', async () => {
      // Arrange
      const p = await project();
      const p2 = await project();

      const nonFilteredKey = 'my-finding-1';
      const filteredKey = 'my-finding-2';

      const j = await jobsModel.create({
        projectId: p.id,
        task: 'CustomJob',
      });

      const f1 = await customDomainFinding(p.id, j.id, filteredKey);
      const f2 = await customDomainFinding(p2.id, j.id, nonFilteredKey);

      // Act
      await projectService.delete(p._id.toString());
      const findings = await findingsService.getAll(0, 100, {});

      // Assert
      expect(findings.totalRecords).toBe(1);
      expect(findings.items[0].correlationKey).toMatch(
        new RegExp(`^project:${p2._id.toString()}`),
      );
    });
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

  async function project() {
    return await projectService.addProject({
      name: randomUUID(),
      imageType: null,
      logo: null,
    });
  }
});
