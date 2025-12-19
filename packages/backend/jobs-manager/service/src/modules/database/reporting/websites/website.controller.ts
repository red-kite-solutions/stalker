import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  BatchEditWebsitesDto,
  DeleteManyWebsitesDto,
  GetWebsitesDto,
  MergeWebsitesDto,
  UnmergeWebsitesDto,
} from './website.dto';
import { Website, WebsiteDocument } from './website.model';
import { WebsiteService } from './website.service';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  /**
   * Read mutliple websites.
   *
   * @remarks
   * Read mutliple websites.
   */
  @ApiDefaultResponsePage(Website)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:read')
  @Get()
  async getWebsites(
    @Query() dto: GetWebsitesDto,
  ): Promise<Page<WebsiteDocument>> {
    const totalRecords = await this.websiteService.count(dto);
    const items = await this.websiteService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Tag a website.
   *
   * @remarks
   * Tag a website by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Put(':id/tags')
  async tagWebsite(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.websiteService.tagWebsite(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  /**
   * Read a website by ID.
   *
   * @remarks
   * Read a website by ID.
   */
  @ApiDefaultResponseExtendModelId(Website)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:read')
  @Get(':id')
  async getWebsite(@Param() idDto: MongoIdDto) {
    return await this.websiteService.get(idDto.id);
  }

  /**
   * Delete multiple website by ID.
   *
   * @remarks
   * Delete multiple website by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:delete')
  @Delete()
  async deleteWebsites(@Body() dto: DeleteManyWebsitesDto) {
    return await this.websiteService.deleteMany(dto.websiteIds);
  }

  /**
   * Delete a website by ID.
   *
   * @remarks
   * Delte a website by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:delete')
  @Delete(':id')
  async deleteWebsite(@Param() idDto: MongoIdDto) {
    return await this.websiteService.delete(idDto.id);
  }

  /**
   * Batch block websites.
   *
   * @remarks
   * Block multiple websites at the same time.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditWebsitesDto) {
    return await this.websiteService.batchEdit(dto);
  }

  /**
   * Merge websites.
   *
   * @remarks
   * Merge multiple websites together so that they can be represented by a single website instance.
   *
   * Merging websites together also ensures that they are scan only once on the main website instance,
   * instead of once for every instance.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch('merge')
  async merge(@Body() dto: MergeWebsitesDto) {
    return await this.websiteService.merge(dto.mergeInto, dto.mergeFrom);
  }

  /**
   * Unmerge websites.
   *
   * @remarks
   * Unmerging websites so that they are represented as themselves instead of by the main website.
   *
   * Unmerging websites ensures that they are scanned individually instead of only once on the main website instance.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch('unmerge')
  async unmerge(@Body() dto: UnmergeWebsitesDto) {
    return await this.websiteService.unmerge(dto.unmerge);
  }
}
