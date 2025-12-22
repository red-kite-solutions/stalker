import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Page } from '../../../types/page.type';
import {
  ApiDefaultResponseExtendModelId,
  ApiDefaultResponsePage,
} from '../../../utils/swagger.utils';
import { AuthenticatedRequest, UserAuthContext } from '../../auth/auth.types';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import {
  MANAGE_APIKEY_DELETE_ALL,
  MANAGE_APIKEY_READ_ALL,
} from '../../auth/scopes.constants';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { userHasScope } from '../../auth/utils/auth.utils';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { ApiKey, ApiKeyDocument } from './api-key.model';
import { ApiKeyService } from './api-key.service';
import { ApiKeyFilterModel } from './api-key.types';
import { ApiKeyFilterDto, CreateApiKeyDto } from './api.key.dto';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('api-key')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  private getUserAuthContext(req: AuthenticatedRequest): UserAuthContext {
    if (!req || !req.user || !req.user.id)
      throw new HttpServerErrorException('No user identified with request');

    return req.user;
  }

  /**
   * Read API keys.
   *
   * @remarks
   * Read a user's API keys, or all users' API keys, depending on the current user scopes.
   */
  @ApiDefaultResponsePage(ApiKey)
  @Scopes(['manage:api-key:read', MANAGE_APIKEY_READ_ALL], { mode: 'oneOf' })
  @Get()
  async getAll(
    @Request() req: AuthenticatedRequest,
    @Query() dto: ApiKeyFilterDto,
  ): Promise<Page<ApiKeyDocument>> {
    const userContext = this.getUserAuthContext(req);
    let filter: ApiKeyFilterModel = dto;

    // Make sure users without proper scope can only get their own keys
    if (!userHasScope(MANAGE_APIKEY_READ_ALL, req.user.scopes)) {
      filter.userId = userContext.id;
    }

    return {
      totalRecords: await this.apiKeyService.count(),
      items: await this.apiKeyService.getAll(dto.page, dto.pageSize, filter),
    };
  }

  /**
   * Read API key by ID.
   *
   * @remarks
   * Read a user's API key by ID, or any users' API key, depending on the current user scopes.
   */
  @ApiDefaultResponseExtendModelId(ApiKey)
  @Scopes(['manage:api-key:read', MANAGE_APIKEY_READ_ALL], { mode: 'oneOf' })
  @Get(':id')
  async get(
    @Request() req: AuthenticatedRequest,
    @Param() dto: MongoIdDto,
  ): Promise<ApiKeyDocument> {
    const userContext = this.getUserAuthContext(req);
    let userId: string = undefined;

    // Make sure users without proper scope can only get their own keys
    if (!userHasScope(MANAGE_APIKEY_READ_ALL, req.user.scopes)) {
      userId = userContext.id;
    }

    return await this.apiKeyService.getById(dto.id, userId);
  }

  /**
   * Create an API key.
   *
   * @remarks
   * Create an API key for the current user with the current scopes.
   */
  @ApiDefaultResponseExtendModelId(ApiKey, {
    type: 'object',
    properties: {
      key: { type: 'string', example: '4c79cd97-e4e9-4262-a88a-11bd9e77b7e4' },
    },
  })
  @Scopes('manage:api-key:create')
  @Post()
  async createKey(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateApiKeyDto,
  ) {
    const userContext = this.getUserAuthContext(req);
    try {
      return await this.apiKeyService.create(
        dto.name,
        userContext.id,
        userContext.scopes,
        dto.expiresAt,
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
   * Delete an API key.
   *
   * @remarks
   * Delete a user's API key by ID, or any users' API key, depending on the current user scopes.
   */
  @Scopes(['manage:api-key:delete', MANAGE_APIKEY_DELETE_ALL], {
    mode: 'oneOf',
  })
  @Delete(':id')
  async deleteKey(
    @Request() req: AuthenticatedRequest,
    @Param() dto: MongoIdDto,
  ): Promise<DeleteResult> {
    const userContext = this.getUserAuthContext(req);
    let userId: string = undefined;

    // Make sure users without proper scope can only delete their own keys
    if (!userHasScope(MANAGE_APIKEY_DELETE_ALL, req.user.scopes)) {
      userId = userContext.id;
    }

    return await this.apiKeyService.delete(dto.id, userId);
  }
}
