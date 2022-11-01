import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllJobs(): Promise<any> {
    return await this.jobsService.getAll();
  }

  @UseGuards(ApiKeyGuard)
  @Delete('byworker/:id')
  async deleteJobByWorker(@Param('id') id: string) {
    return await this.deleteJob(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteAllJobs() {
    return await this.jobsService.deleteAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    return await this.jobsService.delete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getJob(@Param('id') id: string): Promise<any> {
    return await this.jobsService.getById(id);
  }
}
