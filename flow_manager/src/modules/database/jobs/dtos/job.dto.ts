import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JobDto {
  @IsNotEmpty()
  @IsString()
  public id!: string;

  @IsNotEmpty()
  @IsString()
  public task!: string;

  @IsNotEmpty()
  @IsString()
  public program!: string;

  @IsNotEmpty()
  @IsNumber()
  public priority!: number;
}
