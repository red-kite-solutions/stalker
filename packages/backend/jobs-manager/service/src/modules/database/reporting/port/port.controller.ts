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
import { Role } from '../../../auth/constants';
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get()
  async getHostTopTcpPorts(
    @Query() dto: GetPortsDto,
  ): Promise<Port[] | Page<PortDocument | ExtendedPort>> {
    if (dto.detailsLevel === 'summary') throw new HttpNotImplementedException();

    const totalRecords = await this.portsService.count(dto);
    const items = await this.portsService.getAll(dto.page, dto.pageSize, dto);

    return {
      items,
      totalRecords,
    };
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Put(':id/tags')
  async tagPort(@Param() idDto: MongoIdDto, @Body() tagDto: TagItemDto) {
    return await this.portsService.tagPort(
      idDto.id,
      tagDto.tagId,
      tagDto.isTagged,
    );
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get(':id')
  async getPort(@Param() idDto: MongoIdDto) {
    return await this.portsService.getPort(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Delete()
  async deletePorts(@Body() dto: DeleteManyPortsDto) {
    return await this.portsService.deleteMany(dto.portIds);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Delete(':id')
  async deletePort(@Param() idDto: MongoIdDto) {
    return await this.portsService.delete(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Patch()
  async batchEdit(@Body() dto: BatchEditPortsDto) {
    return await this.portsService.batchEdit(dto);
  }
}
