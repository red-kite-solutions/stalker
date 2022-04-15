import { IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  public task!: string;

  @IsNotEmpty()
  public companyId!: string;

  @IsNotEmpty()
  public priority!: number;
}