import { Type } from 'class-transformer';
import { Equals, IsBoolean } from 'class-validator';

export class PatchSubscriptionDto {
  @Equals(true)
  @IsBoolean()
  @Type(() => Boolean)
  revert: boolean;
}
