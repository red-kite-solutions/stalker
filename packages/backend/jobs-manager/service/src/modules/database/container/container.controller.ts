import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { ContainerDocument } from './container.model';
import { ContainerService } from './container.service';

@Controller('containers')
export class ContainerController {
  private logger = new Logger(ContainerController.name);
  constructor(private containerService: ContainerService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAll(): Promise<ContainerDocument[]> {
    return await this.containerService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getContainer(@Param() IdDto: MongoIdDto): Promise<ContainerDocument> {
    return await this.containerService.get(IdDto.id);
  }
}
