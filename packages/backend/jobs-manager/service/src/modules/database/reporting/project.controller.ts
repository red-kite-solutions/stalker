import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult, UpdateResult } from 'mongodb';
import {
  HttpBadRequestException,
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ConfigService } from '../admin/config/config.service';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';

import { AuthGuard } from '@nestjs/passport';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { CreateProjectDto, EditProjectDto } from './project.dto';
import { Project } from './project.model';
import { ProjectService } from './project.service';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly customJobsService: CustomJobsService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getProjects() {
    return await this.projectService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('summary')
  async getProjectSummaries() {
    return await this.projectService.getAllSummaries();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post()
  async createProject(@Body() dto: CreateProjectDto) {
    if ((dto.imageType && !dto.logo) || (dto.logo && !dto.imageType))
      throw new HttpBadRequestException();

    try {
      return await this.projectService.addProject(dto);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getProject(@Param() id: MongoIdDto) {
    return await this.projectService.get(id.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editProject(
    @Param() id: MongoIdDto,
    @Body() dto: EditProjectDto,
  ): Promise<UpdateResult> {
    const data: Partial<Project> = {};
    if ((dto.imageType && !dto.logo) || (dto.logo && !dto.imageType)) {
      throw new HttpBadRequestException();
    } else if (dto.imageType && dto.logo) {
      data['logo'] = this.projectService.generateFullImage(
        dto.logo,
        dto.imageType,
      );
    } else if (dto.logo === '') {
      data['logo'] = dto.logo;
    }

    if (dto.name === '') {
      throw new HttpBadRequestException();
    } else if (dto.name) {
      data['name'] = dto.name;
    }

    if (dto.notes || dto.notes === '') {
      data['notes'] = dto.notes;
    }

    try {
      return await this.projectService.editProject(id.id, data);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteProject(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.projectService.delete(id.id);
  }
}
