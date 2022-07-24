import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
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
