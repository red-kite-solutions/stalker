import { IsNotEmpty, IsString } from 'class-validator';

export class SendSimpleAlertDto {
  @IsNotEmpty()
  @IsString()
  public messageContent: string;

  // @IsNotEmpty()
  // @IsString()
  // public channel: string
}
