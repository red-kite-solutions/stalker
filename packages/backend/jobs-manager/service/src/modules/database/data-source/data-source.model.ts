import { ApiProperty } from '@nestjs/swagger';

export class DataSource {
  @ApiProperty()
  type: 'git';
  @ApiProperty()
  repoUrl: string;
  @ApiProperty()
  avatarUrl: string;
  @ApiProperty()
  branch: string;
}
