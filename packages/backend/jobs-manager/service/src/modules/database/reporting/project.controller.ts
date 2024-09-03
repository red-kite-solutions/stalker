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

  private isValidIpRange(ipRange: string) {
    if (!/^\d\d?\d?\.\d\d?\d?\.\d\d?\d?\.\d\d?\d?\/\d\d?$/.test(ipRange))
      return false;

    const ipMask = ipRange.split('/');

    if (parseInt(ipMask[1]) > 32) return false;

    const ipParts = ipMask[0].split('.');

    for (const part of ipParts) {
      if (parseInt(part) > 255) return false;
    }

    return true;
  }

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

    if (dto.ipRanges) {
      data['ipRanges'] = [];
      for (const range of dto.ipRanges) {
        // TODO: Validate the ip ranges through a decorator
        if (!this.isValidIpRange(range)) {
          throw new HttpBadRequestException();
        }
        data['ipRanges'].push(range);
      }
    } else if (Array.isArray(dto.ipRanges)) {
      // ^ This previous line checks for an empty array. The check is needed because the value
      // may also be, at this point, null or undefined
      // If an empty array is explicitly provided, it is because the user wants to
      // empty the project's ipRanges array. Therefore, we assign an empty array to overwrite the
      // existing one in the database.
      data['ipRanges'] = [];
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
