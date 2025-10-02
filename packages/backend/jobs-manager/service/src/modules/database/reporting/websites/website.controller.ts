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
import { Role } from '../../../auth/constants';
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
import { WebsiteDocument } from './website.model';
import { WebsiteService } from './website.service';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Put(':id/tags')
  async tagPort(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.websiteService.tagWebsite(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:read')
  @Get(':id')
  async getWebsite(@Param() idDto: MongoIdDto) {
    return await this.websiteService.get(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:delete')
  @Delete()
  async deleteWebsites(@Body() dto: DeleteManyWebsitesDto) {
    return await this.websiteService.deleteMany(dto.websiteIds);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:delete')
  @Delete(':id')
  async deleteWebsite(@Param() idDto: MongoIdDto) {
    return await this.websiteService.delete(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditWebsitesDto) {
    return await this.websiteService.batchEdit(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch('merge')
  async merge(@Body() dto: MergeWebsitesDto) {
    return await this.websiteService.merge(dto.mergeInto, dto.mergeFrom);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:websites:update')
  @Patch('unmerge')
  async unmerge(@Body() dto: UnmergeWebsitesDto) {
    return await this.websiteService.unmerge(dto.unmerge);
  }
}
