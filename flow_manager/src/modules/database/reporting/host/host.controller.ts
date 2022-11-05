import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { MongoIdDto } from 'src/types/dto/MongoIdDto';
import { Page } from '../../../../types/page.type';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { GetHostCountDto, HostsPagingDto, TopPortsDto } from './host.dto';
import { HostDocument } from './host.model';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostsService: HostService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id/top-tcp-ports/:top')
  async getHostTopTcpPorts(@Param() dto: TopPortsDto): Promise<number[]> {
    return await this.hostsService.getHostTopTcpPorts(dto.id, dto.top);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getHost(@Param() dto: MongoIdDto): Promise<HostDocument> {
    return await this.hostsService.getHost(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteHost(@Param() dto: MongoIdDto) {
    return await this.hostsService.delete(dto.id);
  }

  private buildFilters(dto: HostsPagingDto | GetHostCountDto) {
    const finalFilter = {};

    // Filter by host
    if (dto.host) {
      const preppedDomainArray = [];
      for (const domain of dto.host) {
        let domainRegex = escapeStringRegexp(domain.toLowerCase());
        preppedDomainArray.push(new RegExp(domainRegex, 'i'));
      }

      finalFilter['name'] = { $all: preppedDomainArray };
    }

    // Filter by company
    if (dto.company) {
      finalFilter['companyId'] = {
        $eq: new ObjectId(dto.company),
      };
    }

    // Filter by tag
    if (dto.tags) {
      const preppedTagsArray = [];
      for (const tag of dto.tags) {
        preppedTagsArray.push(tag.toLowerCase());
      }

      finalFilter['tags'] = { $all: preppedTagsArray };
    }
    return finalFilter;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllHosts(@Query() dto: HostsPagingDto): Promise<Page<HostDocument>> {
    const finalFilter = this.buildFilters(dto);

    const totalRecords = await this.hostsService.count(finalFilter);
    const items = await this.hostsService.getAll(
      parseInt(dto.page),
      parseInt(dto.pageSize),
      finalFilter,
    );

    return {
      items,
      totalRecords,
    };
  }
}
