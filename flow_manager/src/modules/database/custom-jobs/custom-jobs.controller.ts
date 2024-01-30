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
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CustomJobDto } from './custom-jobs.dto';
import { CustomJobsDocument } from './custom-jobs.model';
import { CustomJobsService } from './custom-jobs.service';

@Controller('custom-jobs')
export class CustomJobsController {
  private logger = new Logger(CustomJobsController.name);
  constructor(private customJobsService: CustomJobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: CustomJobDto) {
    try {
      return await this.customJobsService.create(dto);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllCustomJobs(): Promise<CustomJobsDocument[]> {
    return await this.customJobsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editCustomJob(
    @Param() IdDto: MongoIdDto,
    @Body() dto: CustomJobDto,
  ): Promise<UpdateResult> {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteCustomJob(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.customJobsService.delete(IdDto.id);
  }
}
