import { IntersectionType } from '@nestjs/swagger';
import { Transform, Type, plainToClass } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  isArray,
} from 'class-validator';
import { HttpBadRequestException } from '../../exceptions/http.exceptions';
import { booleanStringToBoolean } from '../../utils/boolean-string-to-boolean';
import { PagingDto } from '../database/database.dto';
import { FilterByProjectDto } from '../database/reporting/resource.dto';

export type CustomFindingFieldDto = CustomFindingBaseDto &
  (CustomFindingImageFieldDto | CustomFindingTextFieldDto);

export class CustomFindingBaseDto {
  key: string;
}

export class CustomFindingImageFieldDto {
  public readonly type = 'image';
  public data: string;
}

export class CustomFindingTextFieldDto {
  public readonly type = 'text';
  public label?: string;
  public data?: string;
}

/**
 * Represents a finding.
 */
export class CustomFindingDto {
  public target: string;
  public targetName: string;
  public created: Date;
  public name: string;
  public key: string;
  public jobId: string;
  public fields: CustomFindingFieldDto[];
}

export class FieldFilterDto {
  @IsString()
  key: string;

  @IsOptional()
  data: unknown;
}

export class FindingsFilterDto extends FilterByProjectDto {
  @IsString({ each: true })
  @IsArray()
  targets?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  findingDenyList?: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  findingAllowList?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldFilterDto)
  @Transform(
    ({ value }) => {
      if (value && isArray(value)) {
        return value.map((v) => {
          try {
            return plainToClass(FieldFilterDto, JSON.parse(v));
          } catch {
            throw new HttpBadRequestException(
              'Invalid fieldFilters data, unable to parse',
            );
          }
        });
      }
      return value;
    },
    { toClassOnly: true },
  )
  @IsOptional()
  fieldFilters?: FieldFilterDto[];

  @IsBoolean()
  @Transform(booleanStringToBoolean)
  @IsOptional()
  latestOnly?: boolean;
}

export class FindingsPagingDto extends IntersectionType(
  PagingDto,
  FindingsFilterDto,
) {}

export class WebsiteEndpointFindingDto {
  @IsNotEmpty()
  @IsString()
  target: string;

  @IsNotEmpty()
  @IsString()
  endpoint: string;
}
