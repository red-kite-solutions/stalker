import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HttpNotImplementedException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { TagItemDto } from '../../../../types/dto/tag-item.dto';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id/tags')
  async tagPort(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.portsService.tagPort(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getPort(@Param() idDto: MongoIdDto) {
    return await this.portsService.getPort(idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deletePort(@Param() idDto: MongoIdDto) {
    return await this.portsService.delete(idDto.id);
  }
}
