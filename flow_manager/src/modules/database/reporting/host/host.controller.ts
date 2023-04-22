import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult } from 'mongodb';
import { HttpNotImplementedException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/MongoIdDto';
import { Page } from '../../../../types/page.type';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { HostsFilterDto, PortsDto } from './host.dto';
import { HostDocument } from './host.model';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostsService: HostService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id/ports')
  async getHostTopTcpPorts(
    @Param() idDto: MongoIdDto,
    @Query() dto: PortsDto,
  ): Promise<number[]> {
    if (
      dto.sortOrder === 'ascending' &&
      dto.detailsLevel === 'number' &&
      dto.protocol === 'tcp' &&
      dto.sortType === 'popularity'
    )
      return await this.hostsService.getHostTopTcpPorts(
        idDto.id,
        dto.page,
        dto.pageSize,
      );

    throw new HttpNotImplementedException();
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
  async deleteHost(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.hostsService.delete(dto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllHosts(@Query() dto: HostsFilterDto): Promise<Page<HostDocument>> {
    const totalRecords = await this.hostsService.count(dto);
    const items = await this.hostsService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }
}
