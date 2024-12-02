import {
  BadRequestException,
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
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CustomJobsDocument } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';
import {
  DuplicateJobDto,
  isDuplicateJobDto,
  isJobDto,
  JobDto,
} from './jobs.dto';

@Controller('custom-jobs')
export class CustomJobsController {
  private logger = new Logger(CustomJobsController.name);
  constructor(private customJobsService: CustomJobsService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: JobDto | DuplicateJobDto) {
    try {
      if (isDuplicateJobDto(dto)) {
        const duplicateDto = plainToInstance(DuplicateJobDto, dto);
        await validateOrReject(duplicateDto);
        return await this.customJobsService.duplicate(dto.jobId);
      } else if (isJobDto(dto)) {
        const jobDto = plainToInstance(JobDto, dto);
        await validateOrReject(jobDto);
        return await this.customJobsService.create(dto);
      } else {
        throw new BadRequestException('Unknown request type.');
      }
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllCustomJobs(): Promise<CustomJobsDocument[]> {
    return await this.customJobsService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getCustomJob(@Param() IdDto: MongoIdDto): Promise<CustomJobsDocument> {
    return await this.customJobsService.get(IdDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editCustomJob(
    @Param() IdDto: MongoIdDto,
    @Body() dto: JobDto,
  ): Promise<CustomJobsDocument> {
    try {
      return await this.customJobsService.edit(IdDto.id, dto);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteCustomJob(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.customJobsService.delete(IdDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.Admin)
  @Post('sync')
  async syncCache(): Promise<void> {
    return await this.customJobsService.syncCache();
  }
}
