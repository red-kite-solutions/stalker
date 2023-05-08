import { IsBoolean, IsMongoId, IsNotEmpty } from 'class-validator';

export class TagItemDto {
  @IsMongoId()
  @IsNotEmpty()
  tagId: string;

  @IsNotEmpty()
  @IsBoolean()
  isTagged: boolean;
}
