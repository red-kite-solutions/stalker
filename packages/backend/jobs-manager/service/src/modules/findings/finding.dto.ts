import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  Max,
  Min,
} from 'class-validator';

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
  public label: string;
  public data: string;
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

export class FindingsPagingDto {
  @IsNumberString()
  page: string = '1';

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: string = '15';

  @IsNotEmpty()
  target: string;
}
