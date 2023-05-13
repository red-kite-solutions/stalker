import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsNumberString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class JobExecutionsDto {
  @IsNumberString()
  page: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: string;

  @IsMongoId()
  @IsOptional()
  company: string;
}
