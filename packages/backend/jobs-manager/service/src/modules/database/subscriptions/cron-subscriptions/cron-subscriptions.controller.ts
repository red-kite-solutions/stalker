import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeleteResult, UpdateResult } from 'mongodb';
import { HttpBadRequestException } from '../../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../../types/dto/mongo-id.dto';
import { Role } from '../../../auth/constants';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CronApiTokenGuard } from '../../../auth/guards/cron-api-token.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/role.guard';
import { PatchSubscriptionDto } from '../subscriptions.dto';
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
  @Roles(Role.ReadOnly)
  @Get(':id')
  async getSubscription(
    @Param() idDto: MongoIdDto,
  ): Promise<CronSubscriptionsDocument> {
    return await this.subscriptionsService.get(idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Patch(':id')
  async revertSubscription(
    @Param() idDto: MongoIdDto,
    @Query() queryParams: PatchSubscriptionDto,
  ): Promise<UpdateResult> {
    if (queryParams.revert)
      return await this.subscriptionsService.revertToDefaults(idDto.id);
    else throw new HttpBadRequestException();
  }

  @UseGuards(CronApiTokenGuard)
  @Post(':id/notify')
  async notifySubscription(@Param() idDto: MongoIdDto): Promise<void> {
    await this.subscriptionsService.launchCronSubscriptionJob(idDto.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Put(':id')
  async editSubscription(
    @Param() idDto: MongoIdDto,
    @Body() dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    return await this.subscriptionsService.edit(idDto.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Delete(':id')
  async deleteSubscription(@Param() idDto: MongoIdDto): Promise<DeleteResult> {
    return await this.subscriptionsService.delete(idDto.id);
  }
}
