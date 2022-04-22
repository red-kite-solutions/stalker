import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiKeyGuard } from 'src/modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { SubmitHostDto, SubmitHostManuallyDto } from './host.dto';
import { HostService } from './host.service';

@Controller('report/hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @UseGuards(ApiKeyGuard)
  @Post(':jobId')
  async submitHosts(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) dto: SubmitHostDto,
  ) {
    return await this.hostService.addHostsWithDomainFromJob(dto, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
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
