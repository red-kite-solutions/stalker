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
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { CreateSecretDto } from './secrets.dto';
import { Secret } from './secrets.model';
import { SecretsService } from './secrets.service';

@Controller('secrets')
export class SecretsController {
  constructor(private secretsService: SecretsService) {}

  /**
   * Read the secrets metadata.
   *
   * @remarks
   * Read the secrets metadata.
   */
  @ApiDefaultResponseExtendModelId([Secret])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:secrets:read')
  @Get()
  async getSecrets(): Promise<Secret[]> {
    return await this.secretsService.getAll();
  }

  /**
   * Read a secret metadata.
   *
   * @remarks
   * Read a secret metadata.
   */
  @ApiDefaultResponseExtendModelId(Secret)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:secrets:read')
  @Get(':id')
  async getSecret(@Param() id: MongoIdDto) {
    const s = await this.secretsService.get(id.id);
    if (!s) throw new HttpNotFoundException();
    return s;
  }

  /**
   * Create a secret.
   *
   * @remarks
   * Create a new secret that can then be referenced in the subscriptions to be used in jobs.
   *
   * A secret for a project will override a global secret with the same name.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:secrets:create')
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

  /**
   * Delete a secret.
   *
   * @remarks
   * Deelte a secret.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('manage:secrets:delete')
  @Delete(':id')
  async deleteSecret(@Param() id: MongoIdDto): Promise<DeleteResult> {
    return await this.secretsService.delete(id.id);
  }
}
