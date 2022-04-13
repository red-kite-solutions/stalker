import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { SubmitHostDto } from './host.dto';
import { HostService } from './host.service';

@Controller('report/hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @UseGuards(ApiKeyGuard)
  @Post(':jobId')
  async submitHosts(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) hosts: SubmitHostDto,
  ): Promise<void> {
    await this.hostService.addHostsToDomain(hosts, jobId);
    return;
  }
}
