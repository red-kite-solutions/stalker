import { IsNotEmpty } from 'class-validator';
import { CreateJobDto } from './create-job.dto';

export class CreateDomainNameResolvingJobDto extends CreateJobDto {
  @IsNotEmpty()
  public domainName!: string;
}