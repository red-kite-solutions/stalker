import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { MongoIdDto } from '../../../types/dto/MongoIdDto';
import { SubscriptionDto } from './subscriptions.dto';
import { SubscriptionsDocument } from './subscriptions.model';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post()
  async create(@Body() dto: SubscriptionDto) {
    return await this.subscriptionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Get()
  async getAllSubscriptions(): Promise<SubscriptionsDocument[]> {
    return await this.subscriptionsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.User)
  @Post(':id')
  async deleteTag(@Param() IdDto: MongoIdDto, @Body() dto: SubscriptionDto) {
    return await this.subscriptionsService.edit(IdDto.id, dto);
  }
}
