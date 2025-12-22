import { ApiProperty } from '@nestjs/swagger';
import { DataSource } from '../modules/database/data-source/data-source.model';
import { JobParameterDefinition } from './job-parameter-definition.type';

export class JobSummary {
  @ApiProperty()
  name: string;

  @ApiProperty({ isArray: true, type: JobParameterDefinition })
  parameters: JobParameterDefinition[];

  @ApiProperty()
  builtIn?: boolean;

  @ApiProperty()
  source?: DataSource;
}
