import { IsMongoId, IsNotEmpty } from 'class-validator';

export class MongoIdDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
