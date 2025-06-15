import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CreateTagDto } from './tag.dto';
import { TagsDocument } from './tag.model';
import { TagsService } from './tag.service';

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  /**
   * Read all the tags.
   *
   * @remarks
   * Read all the tags without paging.
   *
   * @scopes manage:tags:read
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:tags:read')
  @Get()
  async getAllTags(): Promise<TagsDocument[]> {
    return await this.tagsService.getAll();
  }

  /**
   * Read a single tag.
   *
   * @remarks
   * Read a single tag by id.
   *
   * @scopes manage:tags:read
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:tags:read')
  @Get(':id')
  async getTag(@Param() dto: MongoIdDto): Promise<TagsDocument> {
    return await this.tagsService.getById(dto.id);
  }

  /**
   * Create a new tag.
   *
   * @remarks
   * Create a new tag.
   *
   * @scopes manage:tags:create
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:tags:create')
  @Post()
  async createTag(@Body() dto: CreateTagDto) {
    try {
      return await this.tagsService.create(dto.text, dto.color);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  /**
   * Delete a tag.
   *
   * @remarks
   * Delete a single tag by id.
   *
   * @scopes manage:tags:delete
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:tags:delete')
  @Delete(':id')
  async deleteTag(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.tagsService.delete(dto.id);
  }
}
