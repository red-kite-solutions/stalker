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
import {
  ApiDefaultResponseExtendModelId,
  ApiDefaultResponsePage,
} from '../../../../utils/swagger.utils';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import {
  BatchEditDomainsDto,
  DeleteDomainsDto,
  DomainsPagingDto,
  EditDomainDto,
  SubmitDomainsDto,
} from './domain.dto';
import { Domain, DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  /**
   * Read multiple domain names.
   *
   * @remarks
   * Read multiple domain names.
   */
  @ApiDefaultResponsePage(Domain)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:read')
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

  /**
   * Create multiple domain names.
   *
   * @remarks
   * Batch submit domain names to create multiple at once.
   *
   * Duplicates are handled and will not be created.
   */
  @ApiDefaultResponseExtendModelId([Domain])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:create')
  @Post()
  async submitDomains(@Body() dto: SubmitDomainsDto) {
    return await this.domainsService.addDomains(dto.domains, dto.projectId);
  }

  /**
   * Tag a domain.
   *
   * @remarks
   * Tag a domain by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:update')
  @Put(':id/tags')
  async tagDomain(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.domainsService.tagDomain(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  /**
   * Batch block domain names.
   *
   * @remarks
   * Block multiple domain names at once, removing them from the automation.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditDomainsDto) {
    return await this.domainsService.batchEdit(dto);
  }

  /**
   * Read a domain name by ID.
   *
   * @remarks
   * Read a domain name by ID.
   */
  @ApiDefaultResponseExtendModelId(Domain)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:read')
  @Get(':id')
  async getDomain(@Param() dto: MongoIdDto): Promise<DomainDocument> {
    return await this.domainsService.getDomain(dto.id);
  }

  /**
   * Edit a domain.
   *
   * @remarks
   * Edit a domain by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:update')
  @Put(':id')
  async editDomain(
    @Param() idDto: MongoIdDto,
    @Body() dto: EditDomainDto,
  ): Promise<UpdateResult> {
    return await this.domainsService.editDomain(idDto.id, dto);
  }

  /**
   * Delete a domain.
   *
   * @remarks
   * Delete a domain by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:delete')
  @Delete(':id')
  async deleteDomain(@Param() idDto: MongoIdDto) {
    return await this.domainsService.delete(idDto.id);
  }

  /**
   * Delete multiple domains.
   *
   * @remarks
   * Delete multiple domains by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:domains:delete')
  @Delete()
  async deleteDomains(@Body() dto: DeleteDomainsDto) {
    if (!dto.domainIds) return;

    const ids = dto.domainIds.map((id) => id.toString());
    return await this.domainsService.deleteMany(ids);
  }
}
