import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { DatalayerModule } from '../datalayer.module';
import { FirstUserController } from './first-user.controller';
import {
  UnprotectedUsersController,
  UsersController,
} from './users.controller';
import { userInitProvider } from './users.provider';
import { UsersService } from './users.service';

@Module({
  imports: [NotificationsModule, DatalayerModule, ApiKeyModule],
  controllers: [
    UsersController,
    UnprotectedUsersController,
    FirstUserController,
  ],
  providers: [UsersService, ...userInitProvider],
  exports: [UsersService, ...userInitProvider],
})
export class UsersModule {}
