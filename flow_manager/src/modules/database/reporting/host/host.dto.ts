import { IsNotEmpty } from 'class-validator';

export class SubmitHostDto {
  @IsNotEmpty()
  domainName: string;

  @IsNotEmpty()
  ips: string[];
}
