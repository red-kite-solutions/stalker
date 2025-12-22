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
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
import { validateOrReject } from '../../../validators/validate-or-reject';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CustomJobEntry, CustomJobsDocument } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';
import { DuplicateJobDto, isDuplicateJobDto, JobDto } from './jobs.dto';

@Controller('custom-jobs')
export class CustomJobsController {
  private logger = new Logger(CustomJobsController.name);
  constructor(private customJobsService: CustomJobsService) {}

  /**
   * Read the job summaries.
   *
   * @remarks
   * Read the job summaries. The summaries are a lighter way to read jobs, where the code is not returned.
   */
  @ApiDefaultResponseExtendModelId([JobSummary])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get('summaries')
  async getAllJobSummaries(): Promise<JobSummary[]> {
    return await this.customJobsService.getAllSummaries();
  }

  /**
   * Create or duplicate a job.
   *
   * @remarks
   * Create or duplicate a job. If the `jobId` parameter is included, the identified
   * job will be duplicated.
   */
  @ApiDefaultResponseExtendModelId(CustomJobEntry)
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

  /**
   * Read multiple jobs.
   *
   * @remarks
   * Read multiple jobs and all their data.
   */
  @ApiDefaultResponseExtendModelId([CustomJobEntry])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get()
  async getAllCustomJobs(): Promise<CustomJobsDocument[]> {
    return await this.customJobsService.getAll();
  }

  /**
   * Read a job.
   *
   * @remarks
   * Read a job and all its data.
   */
  @ApiDefaultResponseExtendModelId(CustomJobEntry)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:read')
  @Get(':id')
  async getCustomJob(@Param() IdDto: MongoIdDto): Promise<CustomJobsDocument> {
    return await this.customJobsService.get(IdDto.id);
  }

  /**
   * Modify a job.
   *
   * @remarks
   * Modify an existing job data.
   */
  @ApiDefaultResponseExtendModelId(CustomJobEntry)
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

  /**
   * Delete a job.
   *
   * @remarks
   * Delete a job by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:delete')
  @Delete(':id')
  async deleteCustomJob(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.customJobsService.delete(IdDto.id);
  }

  /**
   * Sync the orchestrator cache.
   *
   * @remarks
   * Used for debugging purposes, this call synchronizes the orchestrator cache with the
   * current jobs in the database.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:custom-jobs:cache-sync')
  @Post('sync')
  async syncCache(): Promise<void> {
    return await this.customJobsService.syncCache();
  }
}
