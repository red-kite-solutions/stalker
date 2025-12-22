import { ApiProperty } from '@nestjs/swagger';

export class JobParameterDefinition {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  default?: any;
}
