import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { TableDocument } from './tables.model';
import { TableService } from './tables.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Scopes(Role.ReadOnly)
@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  async getAll(): Promise<
    Pick<TableDocument, 'name' | 'icon' | 'isPinned' | '_id'>[]
  > {
    return await this.tableService.getAll();
  }

  @Get(':id')
  async get(@Param() dto: MongoIdDto): Promise<TableDocument> {
    return await this.tableService.getTable(dto.id);
  }
}
