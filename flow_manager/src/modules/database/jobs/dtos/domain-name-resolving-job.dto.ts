import { IsNotEmpty, IsString } from 'class-validator';
import { JobDto } from './job.dto';

export class CreateDomainNameResolvingJobDto extends JobDto {
  @IsNotEmpty()
  @IsString()
  public domainName!: string;
}
