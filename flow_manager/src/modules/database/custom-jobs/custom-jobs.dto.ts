import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CustomJobDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['code'])
  public type!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['python'])
  public language!: string;
}
