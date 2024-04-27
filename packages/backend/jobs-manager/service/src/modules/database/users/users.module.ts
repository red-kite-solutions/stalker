import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { FirstUserController } from './first-user.controller';
import { MagicLinkTokenSchema } from './magic-link-token.model';
import {
  UnprotectedUsersController,
  UsersController,
} from './users.controller';
import { UsersSchema } from './users.model';
import { userInitProvider } from './users.provider';
import { UsersService } from './users.service';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      {
        name: 'users',
        schema: UsersSchema,
      },
      {
        name: 'magicLinkTokens',
        schema: MagicLinkTokenSchema,
      },
    ]),
  ],
  controllers: [
    UsersController,
    UnprotectedUsersController,
    FirstUserController,
  ],
  providers: [UsersService, ...userInitProvider],
  exports: [UsersService, ...userInitProvider],
})
export class UsersModule {}
