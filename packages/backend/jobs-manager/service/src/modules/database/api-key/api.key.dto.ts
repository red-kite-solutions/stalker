import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagingDto } from '../database.dto';

export class ApiKeyFilterDto extends PagingDto {
  @IsOptional()
  @IsMongoId()
  userId: string;
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  expiresAt: number;
}
