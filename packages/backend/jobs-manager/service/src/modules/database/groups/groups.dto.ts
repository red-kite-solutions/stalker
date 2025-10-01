import { IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsMongoId } from 'class-validator';
import { PagingDto } from '../database.dto';

export class GroupsFilterDto {}

export class GetGroupsDto extends IntersectionType(
  PagingDto,
  GroupsFilterDto,
) {}

export class SetUserGroupMembershipDto {
  @IsMongoId()
  userId: string;

  @IsBoolean()
  isMember: boolean;
}
