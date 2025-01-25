import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BaseSubscriptionDto } from '../subscriptions.dto';

export class EventSubscriptionDto extends BaseSubscriptionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  public findings!: string[];

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  public cooldown: number;

  @IsOptional()
  @IsString()
  public discriminator?: string;
}
