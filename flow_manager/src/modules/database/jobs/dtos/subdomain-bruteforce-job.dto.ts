import { IsNotEmpty, IsString } from 'class-validator';
import { JobDto } from './job.dto';

export class SubdomainBruteforceJobDto extends JobDto {
  @IsNotEmpty()
  @IsString()
  public domainName!: string;

  @IsNotEmpty()
  @IsString()
  public wordList: string;
}
