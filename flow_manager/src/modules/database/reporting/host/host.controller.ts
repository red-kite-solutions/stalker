import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { MongoIdDto } from 'src/types/dto/MongoIdDto';
import { TopPortsDto } from './host.dto';
import { HostDocument } from './host.model';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostsService: HostService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id/top-tcp-ports/:top')
  async getHostTopTcpPorts(@Param() dto: TopPortsDto): Promise<number[]> {
    return await this.hostsService.getHostTopTcpPorts(dto.id, dto.top);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getHost(@Param() dto: MongoIdDto): Promise<HostDocument> {
    return await this.hostsService.getHost(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteHost(@Param() dto: MongoIdDto) {
    return await this.hostsService.delete(dto.id);
  }
}
