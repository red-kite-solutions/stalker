import { IsMongoId, IsNotEmpty } from 'class-validator';

export class MongoIdDto {
  /**
   * Unique MongoDB database ID.
   *
   * @example 507f1f77bcf86cd799439011
   */
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
