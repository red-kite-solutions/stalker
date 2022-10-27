import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MongoIdDto } from 'src/types/dto/MongoIdDto';

export class TopPortsDto extends MongoIdDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  top: number;
}
