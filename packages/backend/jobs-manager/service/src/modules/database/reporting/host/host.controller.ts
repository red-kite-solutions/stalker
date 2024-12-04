import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { TagItemDto } from '../../../../types/dto/tag-item.dto';
import { Page } from '../../../../types/page.type';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { Port } from '../port/port.model';
import { PortService } from '../port/port.service';
import {
  BatchEditHostsDto,
  DeleteHostsDto,
  GetHostPortDto,
  HostsFilterDto,
  SubmitHostsDto,
} from './host.dto';
import { HostDocument } from './host.model';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(
    private readonly hostsService: HostService,
    private readonly portsService: PortService,
  ) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post('')
  async submitHosts(@Body() dto: SubmitHostsDto) {
    return await this.hostsService.addHosts(dto.ips, dto.projectId);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Patch()
  async batchEdit(@Body() dto: BatchEditHostsDto) {
    return await this.hostsService.batchEdit(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id/tags')
  async tagHost(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.hostsService.tagHost(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getHost(@Param() dto: MongoIdDto): Promise<HostDocument> {
    return await this.hostsService.getHost(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id/ports/:portNumber')
  async getPort(@Param() dto: GetHostPortDto): Promise<Port> {
    return await this.portsService.getHostPort(dto.id, dto.portNumber);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteHost(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.hostsService.delete(dto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete()
  async deleteHosts(@Body() dto: DeleteHostsDto): Promise<DeleteResult> {
    const ids = dto.hostIds.map((id) => id.toString());
    return await this.hostsService.deleteMany(ids);
  }
}
