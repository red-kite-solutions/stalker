import { IsString } from 'class-validator';

export class DataSourceDto {
  @IsString()
  type: 'git';

  @IsString()
  repoUrl: string;

  @IsString()
  avatarUrl: string;
}
