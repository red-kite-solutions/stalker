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
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { Page } from 'src/types/page.type';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { DomainsPagingDto, EditDomainDto } from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  private buildFilters(dto: DomainsPagingDto) {
    const finalFilter = {};
    console.log(dto);
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
    console.log(finalFilter);
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
  async getDomain(@Param('id') id: string): Promise<DomainDocument> {
    return await this.domainsService.getDomain(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editDomain(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: EditDomainDto,
  ) {
    return await this.domainsService.editDomain(id, dto);
  }
}
