import { IsNotEmpty } from 'class-validator';
import { JobDto } from './job.dto';

export class SubdomainBruteforceJobDto extends JobDto {
  @IsNotEmpty()
  public domain_name!: string;

  @IsNotEmpty()
  public wordList: string;
}
