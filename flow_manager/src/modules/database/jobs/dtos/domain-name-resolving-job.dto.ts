import { IsNotEmpty } from 'class-validator';
import { JobDto } from './job.dto';

export class CreateDomainNameResolvingJobDto extends JobDto {
  @IsNotEmpty()
  public domain_name!: string;
}
