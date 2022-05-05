import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  public task!: string;

  @IsNotEmpty()
  @IsMongoId()
  public companyId!: string;

  @IsNotEmpty()
  @IsNumber()
  public priority!: number;
}
