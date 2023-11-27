import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult, UpdateResult } from 'mongodb';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import { CronSubscriptionsDocument } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Controller('cron-subscriptions')
export class CronSubscriptionsController {
  constructor(private subscriptionsService: CronSubscriptionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: CronSubscriptionDto) {
    return await this.subscriptionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllSubscriptions(): Promise<CronSubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id')
  async editSubscription(
    @Param() IdDto: MongoIdDto,
    @Body() dto: CronSubscriptionDto,
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
