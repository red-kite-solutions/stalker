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
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../../../auth/guards/cron-api-token.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { ApiKeyStrategy } from '../../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { PatchSubscriptionDto } from '../subscriptions.dto';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscriptionsDocument } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Controller('cron-subscriptions')
export class CronSubscriptionsController {
  constructor(private subscriptionsService: CronSubscriptionsService) {}

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: CronSubscriptionDto) {
    return await this.subscriptionsService.create(dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllSubscriptions(): Promise<CronSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getSubscription(
    @Param() idDto: MongoIdDto,
  ): Promise<CronSubscriptionsDocument> {
    return await this.subscriptionsService.get(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Patch(':id')
  async patch(
    @Param() idDto: MongoIdDto,
    @Body() body: PatchSubscriptionDto,
  ): Promise<void> {
    if (body == null) throw new HttpBadRequestException();

    const { revert, isEnabled } = body;
    if (isEnabled == null && revert == null)
      throw new HttpBadRequestException();

    if (revert) {
      await this.subscriptionsService.revertToDefaults(idDto.id);
    }

    if (isEnabled != null) {
      await this.subscriptionsService.updateEnabled(idDto.id, isEnabled);
    }
  }

  @UseGuards(CronApiTokenGuard)
  @Post(':id/notify')
  async notifySubscription(@Param() idDto: MongoIdDto): Promise<void> {
    await this.subscriptionsService.launchCronSubscriptionJob(idDto.id);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editSubscription(
    @Param() idDto: MongoIdDto,
    @Body() dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(idDto.id, dto);
  }

  @UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteSubscription(@Param() idDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(idDto.id);
  }
}
