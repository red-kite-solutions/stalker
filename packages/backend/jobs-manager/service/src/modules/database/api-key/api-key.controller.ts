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
import { AuthenticatedRequest, UserAuthContext } from '../../auth/auth.types';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { ApiKeyDocument } from './api-key.model';
import { ApiKeyService } from './api-key.service';
import { ApiKeyFilterModel } from './api-key.types';
import { ApiKeyFilterDto, CreateApiKeyDto } from './api.key.dto';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
@Roles(Role.ReadOnly)
@Controller('api-key')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  private getUserAuthContext(req: AuthenticatedRequest): UserAuthContext {
    if (!req || !req.user || !req.user.id)
      throw new HttpServerErrorException('No user identified with request');

    return req.user;
  }

  @Get()
  async getAll(
    @Request() req: AuthenticatedRequest,
    @Query() dto: ApiKeyFilterDto,
  ): Promise<Page<ApiKeyDocument>> {
    const userContext = this.getUserAuthContext(req);
    let filter: ApiKeyFilterModel = dto;

    // Make sure non-admin users can only get their own keys
    if (userContext.role !== Role.Admin) {
      filter.userId = userContext.id;
    }

    return {
      totalRecords: await this.apiKeyService.count(),
      items: await this.apiKeyService.getAll(dto.page, dto.pageSize, filter),
    };
  }

  @Get(':id')
  async get(
    @Request() req: AuthenticatedRequest,
    @Param() dto: MongoIdDto,
  ): Promise<ApiKeyDocument> {
    const userContext = this.getUserAuthContext(req);
    let userId: string = undefined;

    // Make sure non-admin users can only get their own keys
    if (userContext.role !== Role.Admin) {
      userId = userContext.id;
    }

    return await this.apiKeyService.getById(dto.id, userId);
  }

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
        userContext.role,
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

  @Delete(':id')
  async deleteKey(
    @Request() req: AuthenticatedRequest,
    @Param() dto: MongoIdDto,
  ): Promise<DeleteResult> {
    const userContext = this.getUserAuthContext(req);
    let userId: string = undefined;

    // Make sure non-admin users can only delete their own keys
    if (userContext.role !== Role.Admin) {
      userId = userContext.id;
    }

    return await this.apiKeyService.delete(dto.id, userId);
  }
}
