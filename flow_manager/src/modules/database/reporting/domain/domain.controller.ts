import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { isArray } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { DomainsPagingDto, GetDomainCountDto } from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  private isStringArray(arr: any) {
    return !(
      !isArray(arr) ||
      arr.length <= 0 ||
      arr.every((element) => {
        return typeof element === 'string';
      })
    );
  }

  private buildFilters(dto: DomainsPagingDto | GetDomainCountDto) {
    const finalFilter = {};

    if (dto.domain) {
      const preppedDomainArray = [];
      for (const domain of dto.domain) {
        let domainRegex = escapeStringRegexp(domain.toLowerCase());
        preppedDomainArray.push(new RegExp(domainRegex, 'i'));
      }

      finalFilter['name'] = { $all: preppedDomainArray };
    }

    if (dto.company) {
      finalFilter['companyId'] = {
        $eq: new ObjectId(dto.company),
      };
    }

    if (dto.tags) {
      const preppedTagsArray = [];
      for (const tag of dto.tags) {
        preppedTagsArray.push(tag.toLowerCase());
      }
      // Pretty sure this filter does not work as it does not consider that tags are not strings...
      // Maybe they should be mongo Ids though and be mapped to a global tag document
      finalFilter['tags'] = { $all: preppedTagsArray };
    }
    return finalFilter;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDomains(
    @Query() dto: DomainsPagingDto,
  ): Promise<DomainDocument[]> {
    const finalFilter = this.buildFilters(dto);

    return await this.domainsService.getAll(
      parseInt(dto.page),
      parseInt(dto.pageSize),
      finalFilter,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('/count')
  async getDomainsCount(@Query() dto: GetDomainCountDto) {
    const finalFilter = this.buildFilters(dto);
    return { count: await this.domainsService.count(finalFilter) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getDomain(@Param('id') id: string): Promise<DomainDocument> {
    return await this.domainsService.getDomain(id);
  }
}
