import { IsHexColor, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  text: string;

  @IsHexColor()
  @IsNotEmpty()
  color: string;
}
