import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Page } from '../../../types/page.type';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { GetGroupsDto } from './groups.dto';
import { GroupDocument } from './groups.model';
import { GroupsService } from './groups.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
@Controller('groups')
export class GroupsController {
  private logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  @Roles(Role.ReadOnly)
  @Get(':id')
  async getGroup(@Param() dto: MongoIdDto): Promise<GroupDocument> {
    return await this.groupsService.get(dto.id);
  }

  @Roles(Role.ReadOnly)
  @Get()
  public async getGroups(dto: GetGroupsDto): Promise<Page<GroupDocument>> {
    const totalRecords = await this.groupsService.count(dto);
    const items = await this.groupsService.getAll(dto.page, dto.pageSize);

    return {
      items,
      totalRecords,
    };
  }
}
