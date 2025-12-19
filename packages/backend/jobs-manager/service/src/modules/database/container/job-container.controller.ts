import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { JobContainerDocument } from './job-container.model';
import { JobContainerService } from './job-container.service';

@Controller('job-containers')
export class JobContainerController {
  private logger = new Logger(JobContainerController.name);
  constructor(private containerService: JobContainerService) {}

  /**
   * Read job containers.
   *
   * @remarks
   * Read the containers in which you can deploy jobs.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-containers:read')
  @Get()
  async getAll(): Promise<JobContainerDocument[]> {
    return await this.containerService.getAll();
  }

  /**
   * Read job container by ID.
   *
   * @remarks
   * Read a container in which you can deploy jobs by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:job-containers:read')
  @Get(':id')
  async getContainer(
    @Param() IdDto: MongoIdDto,
  ): Promise<JobContainerDocument> {
    return await this.containerService.get(IdDto.id);
  }
}
