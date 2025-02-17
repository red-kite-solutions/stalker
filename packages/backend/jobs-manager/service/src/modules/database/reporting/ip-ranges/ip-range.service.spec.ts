import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { DomainsService } from '../domain/domain.service';
import { ProjectService } from '../project.service';
import { IpRangeService } from './ip-range.service';

describe('IP Range Service', () => {
  let moduleFixture: TestingModule;
  let hostService: IpRangeService;
  let domainService: DomainsService;
  let projectService: ProjectService;
  let tagsService: TagsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(IpRangeService);
    domainService = moduleFixture.get(DomainsService);
    projectService = moduleFixture.get(ProjectService);
    tagsService = moduleFixture.get(TagsService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Manage IP ranges', () => {
    it('Should get an IP range', async () => {
      // Arrange

      // Act

      // Assert
      expect(true).toBe(true);
    });
  });

  async function tag(name: string) {
    return await tagsService.create(name, '#cccccc');
  }

  async function project(name: string) {
    return await projectService.addProject({
      name: name,
      imageType: null,
      logo: null,
    });
  }
});
