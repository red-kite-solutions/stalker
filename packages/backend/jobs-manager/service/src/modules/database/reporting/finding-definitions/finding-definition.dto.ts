import { IntersectionType } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { PagingDto, SortDto } from '../../database.dto';

export class FindingDefinitionFilterDto extends SortDto {
  @IsString({ each: true })
  @IsArray()
  keys?: string[];
}

export class FindingDefinitionPagingDto extends IntersectionType(
  PagingDto,
  FindingDefinitionFilterDto,
) {}
