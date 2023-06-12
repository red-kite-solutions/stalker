import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CustomJobLanguages,
  CustomJobTypes,
} from '../jobs/models/custom-job.model';

export class CustomJobDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(CustomJobTypes)
  public type!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(CustomJobLanguages)
  public language!: string;

  @IsMongoId()
  @IsOptional()
  public jobPodConfigId: string;
}
