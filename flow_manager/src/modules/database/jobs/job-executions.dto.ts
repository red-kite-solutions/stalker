import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsNumberString,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class JobExecutionsDto {
  @IsNumberString()
  page: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: string;

  @ValidateIf((dto) => dto.company !== '')
  @IsMongoId()
  @IsOptional()
  company: string;
}
