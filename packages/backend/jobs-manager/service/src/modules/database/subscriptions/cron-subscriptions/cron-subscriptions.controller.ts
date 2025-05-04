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
import { Role } from '../../../auth/constants';
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

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Post()
  async create(@Body() dto: CronSubscriptionDto | DuplicateSubscriptionDto) {
    if ('subscriptionId' in dto) {
      return await this.subscriptionsService.duplicate(dto.subscriptionId);
    } else {
      return await this.subscriptionsService.create(dto);
    }
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get()
  async getAllSubscriptions(): Promise<CronSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.ReadOnly)
  @Get(':id')
  async getSubscription(
    @Param() idDto: MongoIdDto,
  ): Promise<CronSubscriptionsDocument> {
    return await this.subscriptionsService.get(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
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

  @UseGuards(CronApiTokenGuard)
  @Post(':id/notify')
  async notifySubscription(@Param() idDto: MongoIdDto): Promise<void> {
    await this.subscriptionsService.launchCronSubscriptionJob(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Put(':id')
  async editSubscription(
    @Param() idDto: MongoIdDto,
    @Body() dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(idDto.id, dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
  @Scopes(Role.User)
  @Delete(':id')
  async deleteSubscription(@Param() idDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(idDto.id);
  }
}
