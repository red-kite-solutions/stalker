import { IsNotEmpty, IsBoolean } from 'class-validator';

export class SubmitConfigDto {
  @IsNotEmpty()
  @IsBoolean()
  public IsNewContentReported: boolean;
}
