import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { ProjectService } from '../../reporting/project.service';
import { EventSubscriptionDto } from './event-subscriptions.dto';
import { EventSubscriptionsService } from './event-subscriptions.service';

describe('Event Subscriptions Service', () => {
  let moduleFixture: TestingModule;
  let projectService: ProjectService;
  let subscriptionsService: EventSubscriptionsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    projectService = moduleFixture.get(ProjectService);
    subscriptionsService = moduleFixture.get(EventSubscriptionsService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
    const allSubs = await subscriptionsService.getAll();
    for (const s of allSubs) {
      await subscriptionsService.delete(s._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Get event subscriptions', () => {
    it('Should get only the event subscriptions for the project', async () => {
      // Arrange
      const c1 = await project('sub-c1');
      const c2 = await project('sub-c2');
      const finding = 'HostnameFinding';
      const name = 'my special name';

      const subData: EventSubscriptionDto = {
        projectId: '',
        name: 'my sub',
        jobName: 'DomainNameResolvingJob',
        finding: finding,
        cooldown: 3600,
      };

      const s1 = await subscription({
        ...subData,
        projectId: c1._id.toString(),
      });
      const s2 = await subscription({
        ...subData,
        projectId: c2._id.toString(),
        name: name,
      });

      // Act
      const subs = await subscriptionsService.getAllForFinding(
        c2._id.toString(),
        finding,
      );

      // Assert
      expect(subs.length).toStrictEqual(1);
      expect(subs[0].projectId).toStrictEqual(c2._id);
      expect(subs[0].name).toStrictEqual(name);
    });

    it('Should get only the event subscriptions for the finding', async () => {
      // Arrange
      const c1 = await project('sub-c12');
      const c2 = await project('sub-c22');
      const finding = 'HostnameFinding';
      const finding2 = 'HostnameIpFinding';

      const subData: EventSubscriptionDto = {
        projectId: '',
        name: 'my sub',
        jobName: 'DomainNameResolvingJob',
        finding: finding,
        cooldown: 3600,
      };

      const s1 = await subscription({
        ...subData,
        projectId: c1._id.toString(),
      });
      const s2 = await subscription({
        ...subData,
        projectId: c2._id.toString(),
        finding: finding2,
      });

      // Act
      const subs = await subscriptionsService.getAllForFinding(
        c2._id.toString(),
        finding2,
      );

      // Assert
      expect(subs.length).toStrictEqual(1);
      expect(subs[0].projectId).toStrictEqual(c2._id);
      expect(subs[0].finding).toStrictEqual(finding2);
    });
  });

  async function project(name: string) {
    return await projectService.addProject({
      name: name,
      imageType: null,
      logo: null,
    });
  }
  async function subscription(subscription: EventSubscriptionDto) {
    return await subscriptionsService.create(subscription);
  }
});
