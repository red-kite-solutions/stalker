import { IsMongoId, IsNotEmpty } from 'class-validator';

export class TagItemDto {
  @IsMongoId()
  @IsNotEmpty()
  tagId: string;
}
