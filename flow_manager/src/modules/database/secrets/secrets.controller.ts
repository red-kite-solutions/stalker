import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpNotFoundException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CreateSecretDto } from './secrets.dto';
import { SecretsService } from './secrets.service';

@Controller('secrets')
export class SecretsController {
  constructor(private secretsService: SecretsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getSecrets() {
    return await this.secretsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getSecret(@Param() id: MongoIdDto) {
    const s = await this.secretsService.get(id.id);
    if (!s) throw new HttpNotFoundException();
    return s;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async createSecret(@Body() dto: CreateSecretDto) {
    try {
      return await this.secretsService.create(
        dto.name.trim(),
        dto.value,
        !dto.projectId || dto.projectId === ProjectUnassigned
          ? undefined
          : dto.projectId,
        dto.description,
      );
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteSecret(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.secretsService.delete(id.id);
  }
}
