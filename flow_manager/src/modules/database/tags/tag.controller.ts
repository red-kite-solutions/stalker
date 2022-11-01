import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
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
  async getTag(@Param('id') id: string): Promise<TagsDocument> {
    return await this.tagsService.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async createTag(@Body(new ValidationPipe()) dto: CreateTagDto) {
    return await this.tagsService.create(dto.text, dto.color);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteTag(@Param('id') id: string) {
    return await this.tagsService.delete(id);
  }
}
