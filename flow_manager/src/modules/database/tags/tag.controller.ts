import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CreateTagDto } from './tag.dto';
import { TagsDocument } from './tag.model';
import { TagsService } from './tag.service';

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllTags(): Promise<TagsDocument[]> {
    return await this.tagsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getTag(@Param() dto: MongoIdDto): Promise<TagsDocument> {
    return await this.tagsService.getById(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteTag(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.tagsService.delete(dto.id);
  }
}
