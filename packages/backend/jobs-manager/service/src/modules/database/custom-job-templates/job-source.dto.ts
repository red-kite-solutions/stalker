import { IsString } from 'class-validator';

export class JobSourceDto {
  @IsString()
  type: 'git';

  @IsString()
  repoUrl: string;

  @IsString()
  avatarUrl: string;

  @IsString()
  branch: string;
}
