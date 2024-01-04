import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidCustomJobLanguage } from '../../../validators/is-valid-custom-job-language.validator';
import { IsValidFindingHandlerLanguage } from '../../../validators/is-valid-finding-handler-language.validator';

export class CustomJobDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public type!: string;

  @IsValidCustomJobLanguage()
  public language!: string;

  @IsMongoId()
  @IsNotEmpty()
  public jobPodConfigId: string;

  @IsOptional()
  @IsString()
  public findingHandler: string;

  @IsValidFindingHandlerLanguage()
  public findingHandlerLanguage: string;
}
