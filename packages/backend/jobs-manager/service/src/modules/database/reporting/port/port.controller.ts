import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HttpNotImplementedException } from '../../../../exceptions/http.exceptions';
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
import { BatchEditPortsDto, DeleteManyPortsDto, GetPortsDto } from './port.dto';
import { ExtendedPort, Port, PortDocument } from './port.model';
import { PortService } from './port.service';

@Controller('ports')
export class PortController {
  constructor(private readonly portsService: PortService) {}

  /**
   * Read ports.
   *
   * @remarks
   * Read host ports according to their details level to get more or less information.
   */
  @ApiDefaultResponsePage(ExtendedPort)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:read')
  @Get()
  async getHostTopTcpPorts(
    @Query() dto: GetPortsDto,
  ): Promise<Page<PortDocument | ExtendedPort>> {
    if (dto.detailsLevel === 'summary') throw new HttpNotImplementedException();

    const totalRecords = await this.portsService.count(dto);
    const items = await this.portsService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }

  /**
   * Tag a port.
   *
   * @remarks
   * Tag a port by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:update')
  @Put(':id/tags')
  async tagPort(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.portsService.tagPort(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  /**
   * Read a port.
   *
   * @remarks
   * Read a port by ID.
   */
  @ApiDefaultResponseExtendModelId(Port)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:read')
  @Get(':id')
  async getPort(@Param() idDto: MongoIdDto) {
    return await this.portsService.getPort(idDto.id);
  }

  /**
   * Delete multiple ports.
   *
   * @remarks
   * Delete multiple ports by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:delete')
  @Delete()
  async deletePorts(@Body() dto: DeleteManyPortsDto) {
    return await this.portsService.deleteMany(dto.portIds);
  }

  /**
   * Delete a port.
   *
   * @remarks
   * Delete a port by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:delete')
  @Delete(':id')
  async deletePort(@Param() idDto: MongoIdDto) {
    return await this.portsService.delete(idDto.id);
  }

  /**
   * Batch block ports.
   *
   * @remarks
   * Block multiple ports at once, removing them from the automation.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('resources:ports:update')
  @Patch()
  async batchEdit(@Body() dto: BatchEditPortsDto) {
    return await this.portsService.batchEdit(dto);
  }
}
