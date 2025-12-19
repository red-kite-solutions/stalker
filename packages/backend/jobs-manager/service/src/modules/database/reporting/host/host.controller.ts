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
import {
  ApiDefaultResponseExtendModelId,
  ApiDefaultResponsePage,
} from '../../../../utils/swagger.utils';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { Port } from '../port/port.model';
import { PortService } from '../port/port.service';
import {
  BatchEditHostsDto,
  DeleteHostsDto,
  GetHostPortDto,
  HostsPagingDto,
  SubmitHostsDto,
} from './host.dto';
import { Host, HostDocument } from './host.model';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(
    private readonly hostsService: HostService,
    private readonly portsService: PortService,
  ) {}

  /**
   * Create multiple hosts.
   *
   * @remarks
   * Create multiple hosts at the same time.
   */
  @ApiDefaultResponseExtendModelId([Host])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:create')
  @Post('')
  async submitHosts(@Body() dto: SubmitHostsDto) {
    return await this.hostsService.addHosts(dto.ips, dto.projectId);
  }

  /**
   * Batch block hosts.
   *
   * @remarks
   * Block multiple hosts at once, removing them from the automation.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditHostsDto) {
    return await this.hostsService.batchEdit(dto);
  }

  /**
   * Tag a host.
   *
   * @remarks
   * Tag a host by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:update')
  @Put(':id/tags')
  async tagHost(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.hostsService.tagHost(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  /**
   * Read a host.
   *
   * @remarks
   * Read a host by ID.
   */
  @ApiDefaultResponseExtendModelId(Host)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:read')
  @Get(':id')
  async getHost(@Param() dto: MongoIdDto): Promise<HostDocument> {
    return await this.hostsService.getHost(dto.id);
  }

  /**
   * Get the port of a host.
   *
   * @remarks
   * Get the port of a host using the port number and the host ID.
   */
  @ApiDefaultResponseExtendModelId(Port)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:read')
  @Get(':id/ports/:portNumber')
  async getPort(@Param() dto: GetHostPortDto): Promise<Port> {
    return await this.portsService.getHostPort(dto.id, dto.portNumber);
  }

  /**
   * Delete a host.
   *
   * @remarks
   * Delete a host by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:delete')
  @Delete(':id')
  async deleteHost(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    return await this.hostsService.delete(dto.id);
  }

  /**
   * Read multiple hosts.
   *
   * @remarks
   * Read multiple hosts.
   */
  @ApiDefaultResponsePage(Host)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:read')
  @Get()
  async getAllHosts(@Query() dto: HostsPagingDto): Promise<Page<HostDocument>> {
    const totalRecords = await this.hostsService.count(dto);
    const items = await this.hostsService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Delete multiple hosts.
   *
   * @remarks
   * Delete multiple hosts.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:hosts:delete')
  @Delete()
  async deleteHosts(@Body() dto: DeleteHostsDto): Promise<DeleteResult> {
    const ids = dto.hostIds.map((id) => id.toString());
    return await this.hostsService.deleteMany(ids);
  }
}
