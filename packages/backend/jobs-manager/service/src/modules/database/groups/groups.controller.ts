import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Page } from '../../../types/page.type';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { GetGroupsDto, SetUserGroupMembershipDto } from './groups.dto';
import { GroupDocument } from './groups.model';
import { GroupsService } from './groups.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('groups')
export class GroupsController {
  private logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  @Scopes('manage:groups:read')
  @Get(':id')
  async getGroup(@Param() dto: MongoIdDto): Promise<GroupDocument> {
    return await this.groupsService.get(dto.id);
  }

  @Scopes('manage:groups:read')
  @Get()
  public async getGroups(
    @Query() dto: GetGroupsDto,
  ): Promise<Page<GroupDocument>> {
    const totalRecords = await this.groupsService.count(dto);
    const items = await this.groupsService.getAll(dto.page, dto.pageSize);

    return {
      items,
      totalRecords,
    };
  }

  @Scopes('manage:groups:update')
  @Patch(':id')
  public async setUserGroupMembership(
    @Param() groupIdDto: MongoIdDto,
    @Body() dto: SetUserGroupMembershipDto,
  ) {
    return await this.groupsService.setUserGroupMembership(
      groupIdDto.id,
      dto.userId,
      dto.isMember,
    );
  }
}
