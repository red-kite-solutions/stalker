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
import { Role } from '../../../auth/constants';
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
import { ExtendedIpRange, IpRangeDocument } from './ip-range.model';
import { IpRangeService } from './ip-range.service';

@Controller('ip-ranges')
export class IpRangeController {
  constructor(private readonly ipRangesService: IpRangeService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditIpRangesDto) {
    return await this.ipRangesService.batchEdit(dto);
  }

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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:read')
  @Get(':id')
  async get(@Param() dto: MongoIdDto): Promise<IpRangeDocument> {
    return await this.ipRangesService.get(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:delete')
  @Delete(':id')
  async deleteIpRange(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.ipRangesService.delete(dto.id);
  }

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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:delete')
  @Delete()
  async deleteIpRanges(@Body() dto: DeleteIpRangesDto): Promise<DeleteResult> {
    return await this.ipRangesService.deleteMany(dto.ipRangeIds);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ip-ranges:create')
  @Post()
  async submit(@Body() dto: SubmitIpRangesDto) {
    return await this.ipRangesService.submitIpRanges(dto);
  }
}
