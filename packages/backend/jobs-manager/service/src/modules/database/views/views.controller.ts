import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { ViewDocument } from './views.model';
import { ViewService } from './views.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
@Roles(Role.ReadOnly)
@Controller('views')
export class ViewController {
  constructor(private readonly viewService: ViewService) {}

  @Get()
  async getAll(): Promise<
    Pick<ViewDocument, 'name' | 'icon' | 'isPinned' | '_id'>[]
  > {
    return await this.viewService.getAll();
  }

  @Get(':id')
  async get(@Param() dto: MongoIdDto): Promise<ViewDocument> {
    return await this.viewService.getView(dto.id);
  }
}
