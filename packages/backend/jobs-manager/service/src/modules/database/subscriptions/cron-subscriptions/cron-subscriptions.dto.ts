import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DependsOn } from '../../../../validators/depends-on.validator';
import { IsCronExpression } from '../../../../validators/is-cron-expression.validator';
import { BaseSubscriptionDto } from '../subscriptions.dto';
import { InputSource, inputSources } from './cron-subscriptions.model';

export class CronSubscriptionBatchingDto {
  @IsBoolean()
  enabled: boolean;

  @Min(1)
  @IsNumber()
  @IsOptional()
  size?: number;
}

export class CronSubscriptionDto extends BaseSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @IsCronExpression()
  public cronExpression!: string;

  @IsIn(inputSources)
  @IsOptional()
  public input?: InputSource;

  @ValidateNested()
  @DependsOn('input')
  @IsOptional()
  @Type(() => CronSubscriptionBatchingDto)
  public batch?: CronSubscriptionBatchingDto;
}
