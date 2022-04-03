import {
  Body,
  Controller,
  Get,
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
import { Program } from '../program.model';
import { ProgramService } from '../program.service';
import { SubmitSubdomainDto, SubmitSubdomainManuallyDto } from './domain.dto';
import { DomainsService } from './domain.service';

@Controller('report/domains')
export class DomainsController {
  constructor(
    private readonly domainsService: DomainsService,
    private readonly programService: ProgramService,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Post('worker')
  async submitSubdomainsByWorker(
    @Body(new ValidationPipe()) dto: SubmitSubdomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomainsManually(dto);
    return;
  }

  @UseGuards(ApiKeyGuard)
  @Post(':jobId')
  async submitSubdomainsFromJob(
    @Param('jobId') jobId: string,
    @Body(new ValidationPipe()) subdomains: SubmitSubdomainDto,
  ): Promise<void> {
    await this.domainsService.addDomains(subdomains, jobId);
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async submitSubdomains(
    @Body(new ValidationPipe()) dto: SubmitSubdomainManuallyDto,
  ): Promise<void> {
    await this.domainsService.addDomainsManually(dto);
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('index/:program/:i')
  async returnDomainAtIndex(
    @Param('program') program: string,
    @Param('i') index: number,
  ): Promise<Program> {
    return await this.programService.getWithDomainAtIndex(program, index);
  }
}
