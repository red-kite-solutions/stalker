import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { DomainsPagingDto } from './domain.dto';
import { DomainDocument } from './domain.model';
import { DomainsService } from './domain.service';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllDomains(
    @Query(new ValidationPipe()) dto: DomainsPagingDto,
  ): Promise<DomainDocument[]> {
    return await this.domainsService.getAll(
      parseInt(dto.page),
      parseInt(dto.pageSize),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get('/count')
  async getDomainsCount() {
    return { count: await this.domainsService.count() };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getDomain(@Param('id') id: string): Promise<DomainDocument> {
    return await this.domainsService.getDomain(id);
  }
}
