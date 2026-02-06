import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ConfigService } from '../admin/config/config.service';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';

import { AuthGuard } from '@nestjs/passport';
import { PickType } from '@nestjs/swagger';
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
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

  private logger = new Logger(ProjectController.name);

  /**
   * Read all projects.
   *
   * @remarks
   * Read the details of all projects.
   */
  @ApiDefaultResponseExtendModelId([Project])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:read')
  @Get()
  async getProjects() {
    return await this.projectService.getAll();
  }

  /**
   * Read a project summary.
   *
   * @remarks
   * Read all project summaries.
   *
   * Project summaries are used by the frontend for autocompletion and mapping project IDs to project names.
   */
  @ApiDefaultResponseExtendModelId([PickType(Project, ['name'])])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:read')
  @Get('summary')
  async getProjectSummaries() {
    return await this.projectService.getAllSummaries();
  }

  /**
   * Create a new project.
   *
   * @remarks
   * Create a new project to organize your data and share with stakeholders.
   */
  @ApiDefaultResponseExtendModelId(Project)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:create')
  @Post()
  async createProject(@Body() dto: CreateProjectDto) {
    if ((dto.imageType && !dto.logo) || (dto.logo && !dto.imageType))
      throw new HttpBadRequestException();

    try {
      return await this.projectService.addProject(dto);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        this.logger.log(
          `Conflict when creating the project ${dto.name}: ${err}`,
        );
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  /**
   * Read a project by ID.
   *
   * @remarks
   * Read a project by ID.
   */
  @ApiDefaultResponseExtendModelId(Project)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:read')
  @Get(':id')
  async getProject(@Param() id: MongoIdDto) {
    return await this.projectService.get(id.id);
  }

  /**
   * Update a project.
   *
   * @remarks
   * Update the values of a project.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:update')
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

  /**
   * Delete a project.
   *
   * @remarks
   * Delete a project and all its related data.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:projects:delete')
  @Delete(':id')
  async deleteProject(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.projectService.delete(id.id);
  }
}
