import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CanEnableFindingHandler } from '../../../validators/can-enable-finding-handler.validator';
import { IsValidCustomJobLanguage } from '../../../validators/is-valid-custom-job-language.validator';
import { IsValidFindingHandlerLanguage } from '../../../validators/is-valid-finding-handler-language.validator';
import {
  CustomJobFindingHandlerLanguage,
  CustomJobLanguage,
  CustomJobType,
  customJobTypes,
} from '../jobs/models/custom-job.model';

export class CustomJobTemplateDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsIn(customJobTypes)
  @IsString()
  @IsNotEmpty()
  public type!: CustomJobType;

  @IsValidCustomJobLanguage()
  public language!: CustomJobLanguage;

  @IsMongoId()
  @IsNotEmpty()
  @IsString()
  public jobPodConfigId: string;

  @IsOptional()
  @CanEnableFindingHandler()
  findingHandlerEnabled?: boolean;

  @IsOptional()
  @IsString()
  public findingHandler?: string;

  @IsValidFindingHandlerLanguage()
  public findingHandlerLanguage?: CustomJobFindingHandlerLanguage;

  @IsString()
  @IsOptional()
  public category?: string;
}
