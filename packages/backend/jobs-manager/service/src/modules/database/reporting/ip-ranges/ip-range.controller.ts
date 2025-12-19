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
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
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
  BatchEditIpRangesDto,
  DeleteIpRangesDto,
  IpRangesPagingDto,
  SubmitIpRangesDto,
} from './ip-range.dto';
import { ExtendedIpRange, IpRange, IpRangeDocument } from './ip-range.model';
import { IpRangeService } from './ip-range.service';

@Controller('ip-ranges')
export class IpRangeController {
  constructor(private readonly ipRangesService: IpRangeService) {}

  /**
   * Batch block IP ranges.
   *
   * @remarks
   * Block multiple IP ranges at the same time.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditIpRangesDto) {
    return await this.ipRangesService.batchEdit(dto);
  }

  /**
   * Tag an IP range.
   *
   * @remarks
   * Tag an IP range.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:update')
  @Put(':id/tags')
  async tag(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.ipRangesService.tagIpRange(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  /**
   * Read an IP range by ID.
   *
   * @remarks
   * Read an IP range by ID.
   */
  @ApiDefaultResponseExtendModelId(IpRange)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:read')
  @Get(':id')
  async get(@Param() dto: MongoIdDto): Promise<IpRangeDocument> {
    return await this.ipRangesService.get(dto.id);
  }

  /**
   * Delete an IP range by ID.
   *
   * @remarks
   * Delete an IP range by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:delete')
  @Delete(':id')
  async deleteIpRange(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.ipRangesService.delete(dto.id);
  }

  /**
   * Read multiple IP ranges.
   *
   * @remarks
   * Read multiple IP ranges.
   */
  @ApiDefaultResponsePage(ExtendedIpRange)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:read')
  @Get()
  async getAll(
    @Query() dto: IpRangesPagingDto,
  ): Promise<Page<IpRangeDocument | ExtendedIpRange>> {
    const totalRecords = await this.ipRangesService.count(dto);
    const items = await this.ipRangesService.getAll(
      dto.page,
      dto.pageSize,
      dto,
    );

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Delete multiple IP ranges.
   *
   * @remarks
   * Delete multiple IP ranges.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:delete')
  @Delete()
  async deleteIpRanges(@Body() dto: DeleteIpRangesDto): Promise<DeleteResult> {
    return await this.ipRangesService.deleteMany(dto.ipRangeIds);
  }

  /**
   * Create multiple IP ranges.
   *
   * @remarks
   * Create multiple IP ranges.
   */
  @ApiDefaultResponseExtendModelId([IpRange])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:create')
  @Post()
  async submit(@Body() dto: SubmitIpRangesDto) {
    return await this.ipRangesService.submitIpRanges(dto);
  }
}
