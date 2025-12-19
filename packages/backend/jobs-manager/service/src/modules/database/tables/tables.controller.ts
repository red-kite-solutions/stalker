import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { Table, TableDocument } from './tables.model';
import { TableService } from './tables.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  /**
   * Read tables.
   *
   * @remarks
   * Read tables.
   */
  @ApiDefaultResponseExtendModelId([Table])
  @Scopes('data:tables:read')
  @Get()
  async getAll(): Promise<
    Pick<TableDocument, 'name' | 'icon' | 'isPinned' | '_id'>[]
  > {
    return await this.tableService.getAll();
  }

  /**
   * Read a tables by ID.
   *
   * @remarks
   * Read a tables by ID.
   */
  @ApiDefaultResponseExtendModelId(Table)
  @Scopes('data:tables:read')
  @Get(':id')
  async get(@Param() dto: MongoIdDto): Promise<TableDocument> {
    return await this.tableService.getTable(dto.id);
  }
}
