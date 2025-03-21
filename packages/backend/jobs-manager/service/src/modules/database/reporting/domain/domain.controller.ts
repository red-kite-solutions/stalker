import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdateResult } from 'mongodb';

import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { TagItemDto } from '../../../../types/dto/tag-item.dto';
import { Page } from '../../../../types/page.type';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import {
  BatchEditDomainsDto,
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDomains(
    @Query() dto: DomainsPagingDto,
  ): Promise<Page<DomainDocument>> {
    const totalRecords = await this.domainsService.count(dto);
    const items = await this.domainsService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post()
  async submitDomains(@Body() dto: SubmitDomainsDto) {
    return await this.domainsService.addDomains(dto.domains, dto.projectId);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id/tags')
  async tagDomain(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.domainsService.tagDomain(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Patch()
  async batchEdit(@Body() dto: BatchEditDomainsDto) {
    return await this.domainsService.batchEdit(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getDomain(@Param() dto: MongoIdDto): Promise<DomainDocument> {
    return await this.domainsService.getDomain(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editDomain(
    @Param() idDto: MongoIdDto,
    @Body() dto: EditDomainDto,
  ): Promise<UpdateResult> {
    return await this.domainsService.editDomain(idDto.id, dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteDomain(@Param() idDto: MongoIdDto) {
    return await this.domainsService.delete(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteDomains(@Body() dto: DeleteDomainsDto) {
    if (!dto.domainIds) return;

    const ids = dto.domainIds.map((id) => id.toString());
    return await this.domainsService.deleteMany(ids);
  }
}
