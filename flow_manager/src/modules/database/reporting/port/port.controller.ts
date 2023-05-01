import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HttpNotImplementedException } from '../../../../exceptions/http.exceptions';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { GetPortsDto } from './port.dto';
import { Port } from './port.model';
import { PortService } from './port.service';

@Controller('ports')
export class PortController {
  constructor(private readonly portsService: PortService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getHostTopTcpPorts(@Query() dto: GetPortsDto): Promise<Port[]> {
    if (
      dto.sortOrder === 'ascending' &&
      dto.detailsLevel === 'number' &&
      dto.protocol === 'tcp' &&
      dto.sortType === 'popularity'
    ) {
      const ports = await this.portsService.getHostTopTcpPorts(
        dto.hostId,
        dto.page,
        dto.pageSize,
        dto.detailsLevel,
      );
      return ports.sort((a, b) => a.port - b.port); // ascending order
    }

    throw new HttpNotImplementedException();
  }
}
