import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { DeleteResult, UpdateResult } from 'mongodb';
import { HttpBadRequestException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { CronApiTokenGuard } from '../../../auth/guards/cron-api-token.guard';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import {
  DuplicateSubscriptionDto,
  PatchSubscriptionDto,
} from '../subscriptions.dto';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscriptionsDocument } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Controller('cron-subscriptions')
export class CronSubscriptionsController {
  constructor(private subscriptionsService: CronSubscriptionsService) {}

  /**
   * Create or duplicate a cron subscription.
   *
   * @remarks
   * Create a new cron subscription to start jobs based on a cron expression.
   *
   * If the `subscriptionId` parameter is provided, the subscription is duplicated for local changes.
   *
   * @scopes automation:subscriptions:create
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:create')
  @Post()
  async create(@Body() dto: CronSubscriptionDto | DuplicateSubscriptionDto) {
    if ('subscriptionId' in dto) {
      return await this.subscriptionsService.duplicate(dto.subscriptionId);
    } else {
      return await this.subscriptionsService.create(dto);
    }
  }

  /**
   * Read all the cron subscriptions.
   *
   * @remarks
   * Read all the cron subscriptions without paging.
   *
   * @scopes automation:subscriptions:read
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:read')
  @Get()
  async getAllSubscriptions(): Promise<CronSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  /**
   * Read a single cron subscription.
   *
   * @remarks
   * Read a single cron subscription by id.
   *
   * @scopes automation:subscriptions:read
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:read')
  @Get(':id')
  async getSubscription(
    @Param() idDto: MongoIdDto,
  ): Promise<CronSubscriptionsDocument> {
    return await this.subscriptionsService.get(idDto.id);
  }

  /**
   * Enable and disable a cron subscription.
   *
   * @remarks
   * This route can be used to enable and disable a cron subscription.
   *
   * @scopes automation:subscriptions:update
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:update')
  @Patch(':id')
  async patch(
    @Param() idDto: MongoIdDto,
    @Body() body: PatchSubscriptionDto,
  ): Promise<void> {
    if (body == null) throw new HttpBadRequestException();

    const { isEnabled } = body;
    if (isEnabled == null) throw new HttpBadRequestException();

    if (isEnabled != null) {
      await this.subscriptionsService.updateEnabled(idDto.id, isEnabled);
    }
  }

  // Excluded from OpenAPI documentation
  @ApiExcludeEndpoint()
  @UseGuards(CronApiTokenGuard)
  @Post(':id/notify')
  async notifySubscription(@Param() idDto: MongoIdDto): Promise<void> {
    await this.subscriptionsService.launchCronSubscriptionJob(idDto.id);
  }

  /**
   * Update a single cron subscription.
   *
   * @remarks
   * Update a single cron subscription by id.
   *
   * @scopes automation:subscriptions:update
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:update')
  @Put(':id')
  async editSubscription(
    @Param() idDto: MongoIdDto,
    @Body() dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(idDto.id, dto);
  }

  /**
   * Delete a single cron subscription.
   *
   * @remarks
   * Delete a single cron subscription by id.
   *
   * @scopes automation:subscriptions:delete
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:delete')
  @Delete(':id')
  async deleteSubscription(@Param() idDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(idDto.id);
  }
}
