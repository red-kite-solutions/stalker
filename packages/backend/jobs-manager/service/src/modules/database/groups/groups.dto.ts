import { IntersectionType } from '@nestjs/swagger';
import { PagingDto } from '../database.dto';

export class GroupsFilterDto {}

export class GetGroupsDto extends IntersectionType(
  PagingDto,
  GroupsFilterDto,
) {}
