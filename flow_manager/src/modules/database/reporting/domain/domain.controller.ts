import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { MongoIdDto } from '../../../../types/dto/MongoIdDto';
import { Page } from '../../../../types/page.type';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { DomainsPagingDto, EditDomainDto } from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  private buildFilters(dto: DomainsPagingDto) {
    const finalFilter = {};
    // Filter by domain
    if (dto.domain) {
      const preppedDomainArray = [];
      for (const domain of dto.domain) {
        if (domain) {
          let domainRegex = escapeStringRegexp(domain.toLowerCase());
          preppedDomainArray.push(new RegExp(domainRegex, 'i'));
        }
      }
      if (preppedDomainArray.length > 0) {
        finalFilter['name'] = { $all: preppedDomainArray };
      }
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
        if (tag) {
          preppedTagsArray.push(tag.toLowerCase());
        }
      }
      if (preppedTagsArray.length > 0) {
        finalFilter['tags'] = { $all: preppedTagsArray };
      }
    }
    return finalFilter;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDomains(
    @Query() dto: DomainsPagingDto,
  ): Promise<Page<DomainDocument>> {
    const finalFilter = this.buildFilters(dto);
    return {
      totalRecords: await this.domainsService.count(finalFilter),
      items: await this.domainsService.getAll(
        parseInt(dto.page),
        parseInt(dto.pageSize),
        finalFilter,
      ),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getDomain(@Param() dto: MongoIdDto): Promise<DomainDocument> {
    return await this.domainsService.getDomain(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editDomain(
    @Param() idDto: MongoIdDto,
    @Body(new ValidationPipe()) dto: EditDomainDto,
  ) {
    return await this.domainsService.editDomain(idDto.id, dto);
  }
}
