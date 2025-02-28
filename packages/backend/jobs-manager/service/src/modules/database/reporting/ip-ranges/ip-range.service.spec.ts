import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  ipv4RangeValuesToMinMax,
  numberToIpv4,
} from '../../../../utils/ip-address.utils';
import { AppModule } from '../../../app.module';
import { TagsService } from '../../tags/tag.service';
import { SubmitHostsDto } from '../host/host.dto';
import { Host } from '../host/host.model';
import { HostService } from '../host/host.service';
import { ProjectService } from '../project.service';
import { SubmitIpRangesDto } from './ip-range.dto';
import { ExtendedIpRange, IpRange, IpRangeDocument } from './ip-range.model';
import { IpRangeService } from './ip-range.service';

describe('IP Range Service', () => {
  let moduleFixture: TestingModule;
  let ipRangeService: IpRangeService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let ipRangeModel: Model<IpRange>;
  let hostModel: Model<Host>;
  let hostService: HostService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    ipRangeService = moduleFixture.get(IpRangeService);
    projectService = moduleFixture.get(ProjectService);
    tagsService = moduleFixture.get(TagsService);
    ipRangeModel = moduleFixture.get<Model<IpRange>>(getModelToken('iprange'));
    hostModel = moduleFixture.get<Model<Host>>(getModelToken('host'));
    hostService = moduleFixture.get(HostService);
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
    const allTags = await tagsService.getAll();
    for (const t of allTags) {
      await tagsService.delete(t._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('CRUD IP ranges', () => {
    it.each([
      { ranges: [{ ip: '1.1.1.1', mask: 32 }] },
      {
        ranges: [
          { ip: '1.1.1.1', mask: 32 },
          { ip: '1.1.1.1', mask: 18 },
        ],
      },
      {
        ranges: [
          { ip: '1.1.1.1', mask: 32 },
          { ip: '1.1.1.2', mask: 18 },
        ],
      },
    ])('Submit IP ranges: %s', async ({ ranges }) => {
      // Arrange
      const p = await project('test');
      const data: SubmitIpRangesDto = {
        projectId: p._id.toString(),
        ranges,
      };

      // Act
      const ipRanges = await ipRangeService.submitIpRanges(data);

      // Assert
      expect(ipRanges.length).toStrictEqual(ranges.length);

      for (let i = 0; i < ipRanges.length; ++i) {
        const minMax = ipv4RangeValuesToMinMax(
          data.ranges[i].ip,
          data.ranges[i].mask,
        );
        expect(ipRanges[i].ip).toStrictEqual(numberToIpv4(minMax.min));
        expect(ipRanges[i].mask).toStrictEqual(data.ranges[i].mask);
        expect(ipRanges[i].lastSeen).toBeTruthy();
        expect(ipRanges[i].projectId.toString()).toStrictEqual(
          p._id.toString(),
        );
        expect(ipRanges[i].ipMinInt).toStrictEqual(minMax.min);
        expect(ipRanges[i].ipMaxInt).toStrictEqual(minMax.max);
        expect(ipRanges[i].correlationKey).toStrictEqual(
          `project:${p._id.toString()};host:${data.ranges[i].ip};mask:${
            data.ranges[i].mask
          }`,
        );
      }
    });

    it.each([
      { ranges: [{ ip: '1.1.1.1', mask: 32 }] },
      {
        ranges: [
          { ip: '1.1.1.1', mask: 32 },
          { ip: '1.1.1.1', mask: 18 },
        ],
      },
      {
        ranges: [
          { ip: '1.1.1.1', mask: 32 },
          { ip: '1.1.1.2', mask: 18 },
        ],
      },
    ])('Create IP ranges: %s', async ({ ranges }) => {
      // Arrange
      const p = await project('test');
      const data: SubmitIpRangesDto = {
        projectId: p._id.toString(),
        ranges,
      };

      // Act
      const ipRanges: IpRangeDocument[] = [];
      for (const range of ranges) {
        ipRanges.push(
          await ipRangeService.addIpRange(
            range.ip,
            range.mask,
            p._id.toString(),
          ),
        );
      }

      // Assert
      expect(ipRanges.length).toStrictEqual(ranges.length);

      for (let i = 0; i < ipRanges.length; ++i) {
        const minMax = ipv4RangeValuesToMinMax(
          data.ranges[i].ip,
          data.ranges[i].mask,
        );
        expect(ipRanges[i].ip).toStrictEqual(numberToIpv4(minMax.min));
        expect(ipRanges[i].mask).toStrictEqual(data.ranges[i].mask);
        expect(ipRanges[i].lastSeen).toBeTruthy();
        expect(ipRanges[i].projectId.toString()).toStrictEqual(
          p._id.toString(),
        );
        expect(ipRanges[i].ipMinInt).toStrictEqual(minMax.min);
        expect(ipRanges[i].ipMaxInt).toStrictEqual(minMax.max);
        expect(ipRanges[i].correlationKey).toStrictEqual(
          `project:${p._id.toString()};host:${data.ranges[i].ip};mask:${
            data.ranges[i].mask
          }`,
        );
      }
    });

    it('Read an IP range from the database by id', async () => {
      // Arrange
      const p = await project('test');
      const r = { ip: '1.1.1.1', mask: 32 };

      const createdRange = await ipRangeService.addIpRange(
        r.ip,
        r.mask,
        p._id.toString(),
      );

      // Act
      const range = await ipRangeService.get(createdRange._id.toString());

      // Assert
      const minMax = ipv4RangeValuesToMinMax(r.ip, r.mask);
      expect(range.ip).toStrictEqual(r.ip);
      expect(range.mask).toStrictEqual(r.mask);
      expect(range.lastSeen).toBeTruthy();
      expect(range.projectId.toString()).toStrictEqual(p._id.toString());
      expect(range.ipMinInt).toStrictEqual(minMax.min);
      expect(range.ipMaxInt).toStrictEqual(minMax.max);
      expect(range.correlationKey).toStrictEqual(
        `project:${p._id.toString()};host:${r.ip};mask:${r.mask}`,
      );
    });

    it('Read IP ranges with paging', async () => {
      // Arrange
      const p = await project('test');
      const ranges = [
        { ip: '1.1.1.1', mask: 32 },
        { ip: '1.1.1.1', mask: 31 },
        { ip: '1.1.1.1', mask: 30 },
        { ip: '1.1.1.1', mask: 29 },
        { ip: '1.1.1.1', mask: 28 },
        { ip: '1.1.1.1', mask: 27 },
      ];
      for (const r of ranges) {
        await ipRangeService.addIpRange(r.ip, r.mask, p._id.toString());
      }

      // Act
      const rangePage = await ipRangeService.getAll(1, 2);

      // Assert
      expect(rangePage.length).toStrictEqual(2);
      expect(rangePage[0].mask).toStrictEqual(30);
      expect(rangePage[1].mask).toStrictEqual(29);
    });

    it('Tag an IP range', async () => {
      // Arrange
      const p = await project('test');
      const r = { ip: '1.1.1.1', mask: 32 };

      const createdRange = await ipRangeService.addIpRange(
        r.ip,
        r.mask,
        p._id.toString(),
      );
      const t = await tag('tag1');

      // Act
      await ipRangeService.tagIpRange(
        createdRange._id.toString(),
        t._id.toString(),
        true,
      );

      // Assert
      const taggedRange = await ipRangeService.get(createdRange._id.toString());
      expect(taggedRange.tags.length).toStrictEqual(1);
      expect(taggedRange.tags[0].toString()).toStrictEqual(t._id.toString());
    });

    it('Tag an IP range by IP and mask', async () => {
      // Arrange
      const p = await project('test');
      const r = { ip: '1.1.1.1', mask: 32 };

      const createdRange = await ipRangeService.addIpRange(
        r.ip,
        r.mask,
        p._id.toString(),
      );
      const t = await tag('tag1');

      // Act
      await ipRangeService.tagIpRangeByIp(
        createdRange.ip,
        createdRange.mask,
        createdRange.projectId.toString(),
        t._id.toString(),
        true,
      );

      // Assert
      const taggedRange = await ipRangeService.get(createdRange._id.toString());
      expect(taggedRange.tags.length).toStrictEqual(1);
      expect(taggedRange.tags[0].toString()).toStrictEqual(t._id.toString());
    });

    it('Block an IP range', async () => {
      // Arrange
      const p = await project('test');
      const r = { ip: '1.1.1.1', mask: 32 };

      const createdRange = await ipRangeService.addIpRange(
        r.ip,
        r.mask,
        p._id.toString(),
      );

      // Act
      await ipRangeService.batchEdit({
        block: true,
        ipRangeIds: [createdRange._id.toString()],
      });

      // Assert
      const blockedRange = await ipRangeService.get(
        createdRange._id.toString(),
      );
      expect(blockedRange.blocked).toStrictEqual(true);
      expect(blockedRange.blockedAt).toBeTruthy();
    });

    it('Delete an IP range from the database', async () => {
      // Arrange
      const p = await project('test');
      const ranges = [
        { ip: '1.1.1.1', mask: 32 },
        { ip: '1.1.1.1', mask: 31 },
        { ip: '1.1.1.1', mask: 30 },
        { ip: '1.1.1.1', mask: 29 },
        { ip: '1.1.1.1', mask: 28 },
      ];

      const createdRanges: IpRangeDocument[] = [];
      for (const r of ranges) {
        createdRanges.push(
          await ipRangeService.addIpRange(r.ip, r.mask, p._id.toString()),
        );
      }

      // Act
      await ipRangeService.delete(createdRanges[0]._id.toString());
      await ipRangeService.delete(createdRanges[1]._id.toString());

      // Assert
      const allRanges = await ipRangeService.getAll();
      expect(allRanges.length).toStrictEqual(3);
    });
  });

  describe('Filters', () => {
    it('Filters for ranges containing IP', async () => {
      // Arrange
      const p = await project('test');
      const ranges = [{ ip: '1.1.1.1', mask: 24 }];

      const hostsInRange: SubmitHostsDto = {
        ips: ['1.1.1.1', '1.1.1.34', '1.1.1.255', '1.1.1.0'],
        projectId: p._id.toString(),
      };

      const hostsOutOfRange: SubmitHostsDto = {
        ips: ['1.1.2.0', '127.0.0.1', '1.1.0.255'],
        projectId: p._id.toString(),
      };

      const allHosts = hostsInRange.ips.concat(hostsOutOfRange.ips);

      const createdRanges: IpRangeDocument[] = [];
      for (const r of ranges) {
        createdRanges.push(
          await ipRangeService.addIpRange(r.ip, r.mask, p._id.toString()),
        );
      }

      // Act
      let range = await ipRangeService.getAll(null, null, {
        contains: hostsInRange.ips,
      });

      // Assert
      expect(range.length).toStrictEqual(1);

      // Act
      range = await ipRangeService.getAll(null, null, {
        contains: hostsOutOfRange.ips,
      });

      // Assert
      expect(range.length).toStrictEqual(0);
    });

    it('Filters by project id', async () => {
      // Arrange
      const p = await project('test');
      const p2 = await project('test2');
      const ranges = [
        { ip: '1.1.1.1', mask: 24, pid: p._id.toString() },
        { ip: '1.1.1.1', mask: 24, pid: p2._id.toString() },
      ];

      const createdRanges: IpRangeDocument[] = [];
      for (const r of ranges) {
        createdRanges.push(
          await ipRangeService.addIpRange(r.ip, r.mask, r.pid),
        );
      }

      // Act
      let range = await ipRangeService.getAll(null, null, {
        projects: [p._id.toString()],
      });

      // Assert
      expect(range.length).toStrictEqual(1);
    });

    it('Filters by tag', async () => {
      // Arrange
      const p = await project('test');
      const ranges = [
        { ip: '1.1.1.1', mask: 24, pid: p._id.toString() },
        { ip: '1.1.1.1', mask: 23, pid: p._id.toString() },
      ];

      const t = await tag('asdf');

      const createdRanges: IpRangeDocument[] = [];
      for (const r of ranges) {
        createdRanges.push(
          await ipRangeService.addIpRange(r.ip, r.mask, p._id.toString()),
        );
      }

      await ipRangeService.tagIpRange(
        createdRanges[0]._id.toString(),
        t._id.toString(),
        true,
      );

      // Act
      let range = await ipRangeService.getAll(null, null, {
        tags: [t._id.toString()],
      });

      // Assert
      expect(range.length).toStrictEqual(1);
      expect(range[0].tags[0].toString()).toStrictEqual(t._id.toString());
    });

    it('Extended getAll includes the ip range hosts', async () => {
      // Arrange
      const p = await project('test');
      const ranges = [{ ip: '1.1.1.1', mask: 24 }];

      const hostsInRange: SubmitHostsDto = {
        ips: ['1.1.1.1', '1.1.1.34', '1.1.1.255', '1.1.1.0'],
        projectId: p._id.toString(),
      };

      const hostsOutOfRange: SubmitHostsDto = {
        ips: ['1.1.2.0', '127.0.0.1', '1.1.0.255'],
        projectId: p._id.toString(),
      };

      const createdRanges: IpRangeDocument[] = [];
      for (const r of ranges) {
        createdRanges.push(
          await ipRangeService.addIpRange(r.ip, r.mask, p._id.toString()),
        );
      }

      const allHosts = hostsInRange.ips.concat(hostsOutOfRange.ips);
      await hostService.addHosts(allHosts, p._id.toString());

      // Act
      let range: ExtendedIpRange[] = await ipRangeService.getAll(null, null, {
        detailsLevel: 'extended',
      });

      // Assert
      expect(range.length).toStrictEqual(1);
      expect(range[0].hosts.length).toStrictEqual(hostsInRange.ips.length);
      expect(range[0].hosts.map((h) => h.ip)).toStrictEqual(hostsInRange.ips);
    });
  });

  describe('Automation mechanics', () => {
    it('A blocked IP range is identified as so with its correlation key', async () => {
      // Arrange
      const p = await project('test');
      const r = { ip: '1.1.1.1', mask: 32 };

      const createdRange = await ipRangeService.addIpRange(
        r.ip,
        r.mask,
        p._id.toString(),
      );

      await ipRangeService.batchEdit({
        block: true,
        ipRangeIds: [createdRange._id.toString()],
      });

      // Act
      let blocked = await ipRangeService.keyIsBlocked(
        createdRange.correlationKey,
      );

      // Assert
      expect(blocked).toStrictEqual(true);

      // Act
      await ipRangeService.batchEdit({
        block: false,
        ipRangeIds: [createdRange._id.toString()],
      });
      blocked = await ipRangeService.keyIsBlocked(createdRange.correlationKey);

      // Assert
      expect(blocked).toStrictEqual(false);
    });

    it('Update the lastSeen when a known IP range is added', async () => {
      // Arrange
      const range = { ip: '1.1.1.1', mask: 32 };
      const p = await project('test');

      const ipRangeBefore = await ipRangeService.addIpRange(
        range.ip,
        range.mask,
        p._id.toString(),
      );

      await new Promise((r) => setTimeout(r, 5));

      // Act
      const ipRangeAfter = await ipRangeService.addIpRange(
        range.ip,
        range.mask,
        p._id.toString(),
      );

      // Assert
      expect(ipRangeBefore.lastSeen).toBeTruthy();
      expect(ipRangeAfter.lastSeen).toBeTruthy();
      expect(ipRangeBefore.lastSeen).toBeLessThan(ipRangeAfter.lastSeen);
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
