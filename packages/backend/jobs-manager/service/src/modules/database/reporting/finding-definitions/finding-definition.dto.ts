import { IntersectionType } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { SortDto } from '../../../../types/dto/sort.dto';
import { PagingDto } from '../../database.dto';

export class FindingDefinitionFilterDto extends SortDto {
  @IsString({ each: true })
  @IsArray()
  keys?: string[];
}

export class FindingDefinitionPagingDto extends IntersectionType(
  PagingDto,
  FindingDefinitionFilterDto,
) {}
