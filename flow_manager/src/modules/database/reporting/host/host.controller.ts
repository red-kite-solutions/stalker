import { Body, Controller, Param, Post, ValidationPipe } from '@nestjs/common';
import { SubmitHostDto } from './host.dto';
import { HostService } from './host.service';

@Controller('report/hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @Post(':jobId')
  async submitHosts(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) dto: SubmitHostDto,
  ): Promise<void> {
    await this.hostService.addHostsWithDomainFromJob(dto, jobId);
    return;
  }
}
