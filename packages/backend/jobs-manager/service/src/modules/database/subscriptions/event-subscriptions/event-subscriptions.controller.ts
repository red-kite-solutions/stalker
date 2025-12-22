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
import { DeleteResult, UpdateResult } from 'mongodb';
import { HttpBadRequestException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { ApiDefaultResponseExtendModelId } from '../../../../utils/swagger.utils';
import { Scopes } from '../../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../../auth/guards/scope.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import {
  DuplicateSubscriptionDto,
  PatchSubscriptionDto,
} from '../subscriptions.dto';
import { EventSubscriptionDto } from './event-subscriptions.dto';
import {
  EventSubscription,
  EventSubscriptionsDocument,
} from './event-subscriptions.model';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Controller('event-subscriptions')
export class EventSubscriptionsController {
  constructor(private subscriptionsService: EventSubscriptionsService) {}

  /**
   * Create or duplicate an event subscription.
   *
   * @remarks
   * Create a new event subscription to start jobs based on findings.
   *
   * If the `subscriptionId` parameter is provided, the subscription is duplicated for local changes.
   */
  @ApiDefaultResponseExtendModelId(EventSubscription)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:create')
  @Post()
  async create(@Body() dto: EventSubscriptionDto | DuplicateSubscriptionDto) {
    if ('subscriptionId' in dto) {
      return await this.subscriptionsService.duplicate(dto.subscriptionId);
    } else {
      return await this.subscriptionsService.create(dto);
    }
  }

  /**
   * Read all event subscriptions
   *
   * @remarks
   * Read all event subscriptions.
   */
  @ApiDefaultResponseExtendModelId([EventSubscription])
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:read')
  @Get()
  async getAllSubscriptions(): Promise<EventSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  /**
   * Get an event susbcription by ID.
   *
   * @remarks
   * Get an event susbcription by ID.
   */
  @ApiDefaultResponseExtendModelId(EventSubscription)
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:read')
  @Get(':id')
  async getSubscription(
    @Param() IdDto: MongoIdDto,
  ): Promise<EventSubscriptionsDocument> {
    return await this.subscriptionsService.get(IdDto.id);
  }

  /**
   * Enable and disable an event subscription by ID.
   *
   * @remarks
   * Enable and disable an event subscription by ID. To enable, set isEnabled to true.
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

  /**
   * Modify an existing event subscription with new values.
   *
   * @remarks
   * Modify an existing event subscription with new values by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:update')
  @Put(':id')
  async editSubscription(
    @Param() IdDto: MongoIdDto,
    @Body() dto: EventSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(IdDto.id, dto);
  }

  /**
   * Delete an existing event subscription.
   *
   * @remarks
   * Delete an existing event subscription by ID.
   */
  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes('automation:subscriptions:delete')
  @Delete(':id')
  async deleteSubscription(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(IdDto.id);
  }
}
