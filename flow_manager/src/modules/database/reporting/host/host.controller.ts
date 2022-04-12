import { Body, Controller, Param, Post, ValidationPipe } from '@nestjs/common';
import { SubmitHostDto, SubmitHostManuallyDto } from './host.dto';
import { HostService } from './host.service';

@Controller('report/hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @Post(':jobId')
  async submitHosts(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) dto: SubmitHostDto,
  ) {
    return await this.hostService.addHostsWithDomainFromJob(dto, jobId);
  }

  @Post()
  async submitHostsManually(
    @Body(new ValidationPipe()) dto: SubmitHostManuallyDto,
  ) {
    return await this.hostService.addHostsWithDomain(
      dto.ips,
      dto.domainName,
      dto.companyId,
    );
  }
}
