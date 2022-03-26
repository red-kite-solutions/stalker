import { IsNotEmpty } from 'class-validator';
import { CreateJobDto } from './create-job.dto';

export class SubdomainBruteforceJobDto extends CreateJobDto {
  @IsNotEmpty()
  public domain_name!: string;

  @IsNotEmpty()
  public wordList: string;
}
