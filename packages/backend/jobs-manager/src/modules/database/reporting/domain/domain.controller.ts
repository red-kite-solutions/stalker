import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdateResult } from 'mongodb';

import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { TagItemDto } from '../../../../types/dto/tag-item.dto';
import { Page } from '../../../../types/page.type';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import {
  DeleteDomainsDto,
  DomainsPagingDto,
  EditDomainDto,
  SubmitDomainsDto,
} from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDomains(
    @Query() dto: DomainsPagingDto,
  ): Promise<Page<DomainDocument>> {
    const finalFilter = this.domainsService.buildFilters(dto);
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
  @Roles(Role.User)
  @Post()
  async submitDomains(@Body() dto: SubmitDomainsDto) {
    return await this.domainsService.addDomains(dto.domains, dto.projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id/tags')
  async tagDomain(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.domainsService.tagDomain(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
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
    @Body() dto: EditDomainDto,
  ): Promise<UpdateResult> {
    return await this.domainsService.editDomain(idDto.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteDomain(@Param() idDto: MongoIdDto) {
    return await this.domainsService.delete(idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteDomains(@Body() dto: DeleteDomainsDto) {
    if (!dto.domainIds) return;

    const ids = dto.domainIds.map((id) => id.toString());
    return await this.domainsService.deleteMany(ids);
  }
}
