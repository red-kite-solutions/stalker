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
import { DeleteResult, UpdateResult } from 'mongodb';
import { HttpBadRequestException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { PatchSubscriptionDto } from '../subscriptions.dto';
import { EventSubscriptionDto } from './event-subscriptions.dto';
import { EventSubscriptionsDocument } from './event-subscriptions.model';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Controller('event-subscriptions')
export class EventSubscriptionsController {
  constructor(private subscriptionsService: EventSubscriptionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: EventSubscriptionDto) {
    return await this.subscriptionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllSubscriptions(): Promise<EventSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getSubscription(
    @Param() IdDto: MongoIdDto,
  ): Promise<EventSubscriptionsDocument> {
    return await this.subscriptionsService.get(IdDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
      console.log(body);
      await this.subscriptionsService.updateEnabled(idDto.id, isEnabled);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editSubscription(
    @Param() IdDto: MongoIdDto,
    @Body() dto: EventSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(IdDto.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteSubscription(@Param() IdDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(IdDto.id);
  }
}
