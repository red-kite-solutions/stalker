import { ApiProperty } from '@nestjs/swagger';

export class Page<T> {
  @ApiProperty({ example: 1 })
  totalRecords: number;
  items: Array<T>;
}
