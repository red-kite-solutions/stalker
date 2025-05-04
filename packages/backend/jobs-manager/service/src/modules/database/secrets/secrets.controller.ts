import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpNotFoundException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { Role } from '../../auth/constants';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CreateSecretDto } from './secrets.dto';
import { SecretsService } from './secrets.service';

@Controller('secrets')
export class SecretsController {
  constructor(private secretsService: SecretsService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get()
  async getSecrets() {
    return await this.secretsService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get(':id')
  async getSecret(@Param() id: MongoIdDto) {
    const s = await this.secretsService.get(id.id);
    if (!s) throw new HttpNotFoundException();
    return s;
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Delete(':id')
  async deleteSecret(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.secretsService.delete(id.id);
  }
}
