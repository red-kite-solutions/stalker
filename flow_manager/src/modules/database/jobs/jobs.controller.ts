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
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { CreateJobDto } from './dtos/create-job.dto';
import { JobsService } from './jobs.service';
import { Job } from './models/jobs.model';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllJobs(): Promise<any> {
    return await this.jobsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post('create')
  @Post()
  async createJob(
    @Body(new ValidationPipe()) unidentifiedJob: CreateJobDto,
  ): Promise<Job> {
    return await this.jobsService.publish(unidentifiedJob);
  }

  @UseGuards(ApiKeyGuard)
  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    return await this.jobsService.delete(id);
  }
}
