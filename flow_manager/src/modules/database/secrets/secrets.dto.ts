import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { IsProjectId } from '../../../validators/is-project-id.validator';

export class CreateSecretDto {
  // no spaces but at the edges, they will be trimmed
  // no "{" or "}"
  // These characters would interfere with the injection of secrets in jobs
  // https://regex101.com/r/A8LsG9/1
  @IsNotEmpty()
  @IsString()
  @Matches(/^\s*[^\s\{\}]+\s*$/)
  public name: string;

  @IsNotEmpty()
  @IsString()
  public value: string;

  @IsProjectId()
  @IsOptional()
  public projectId: string;

  @IsOptional()
  @IsString()
  public description: string;
}
