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
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { JobSummary } from '../../../types/job-summary.type';
import { validateOrReject } from '../../../validators/validate-or-reject';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CustomJobsDocument } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';
import { DuplicateJobDto, isDuplicateJobDto, JobDto } from './jobs.dto';

@Controller('custom-jobs')
export class CustomJobsController {
  private logger = new Logger(CustomJobsController.name);
  constructor(private customJobsService: CustomJobsService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get('summaries')
  async getAllJobSummaries(): Promise<JobSummary[]> {
    return await this.customJobsService.getAllSummaries();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:create')
  @Post()
  async create(@Body() dto: JobDto | DuplicateJobDto) {
    try {
      if (isDuplicateJobDto(dto)) {
        const duplicateDto = plainToInstance(DuplicateJobDto, dto);
        await validateOrReject(duplicateDto);
        return await this.customJobsService.duplicate(dto.jobId);
      } else {
        const jobDto = plainToInstance(JobDto, dto);
        await validateOrReject(jobDto);
        return await this.customJobsService.create(dto);
      }
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        throw new HttpConflictException();
      }

      if (err instanceof BadRequestException) {
        throw err;
      }

      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get()
  async getAllCustomJobs(): Promise<CustomJobsDocument[]> {
    return await this.customJobsService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get(':id')
  async getCustomJob(@Param() IdDto: MongoIdDto): Promise<CustomJobsDocument> {
    return await this.customJobsService.get(IdDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:update')
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:delete')
  @Delete(':id')
  async deleteCustomJob(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.customJobsService.delete(IdDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:cache-sync')
  @Post('sync')
  async syncCache(): Promise<void> {
    return await this.customJobsService.syncCache();
  }
}
