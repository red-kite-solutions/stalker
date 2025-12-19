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
import {
  ApiDefaultResponseExtendModelId,
  ApiDefaultResponsePage,
} from '../../../utils/swagger.utils';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { GetGroupsDto, SetUserGroupMembershipDto } from './groups.dto';
import { Group, GroupDocument } from './groups.model';
import { GroupsService } from './groups.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('groups')
export class GroupsController {
  private logger = new Logger(GroupsController.name);

  constructor(private readonly groupsService: GroupsService) {}

  /**
   * Read a group by ID.
   *
   * @remarks
   * Read a user group to see its details, permissions and members.
   */
  @ApiDefaultResponseExtendModelId(Group)
  @Scopes('manage:groups:read')
  @Get(':id')
  async getGroup(@Param() dto: MongoIdDto): Promise<GroupDocument> {
    return await this.groupsService.get(dto.id);
  }

  /**
   * Read all groups.
   *
   * @remarks
   * Read the different user groups available.
   */
  @ApiDefaultResponsePage(Group)
  @Scopes('manage:groups:read')
  @Get()
  public async getGroups(@Query() dto: GetGroupsDto): Promise<Page<Group>> {
    const totalRecords = await this.groupsService.count(dto);
    const items = await this.groupsService.getAll(dto.page, dto.pageSize);

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Modify the members of an existing group.
   *
   * @remarks
   * Modify the members of an existing group.
   */
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
