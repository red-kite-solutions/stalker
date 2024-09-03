import { MongooseModule } from '@nestjs/mongoose';
import { MagicLinkTokenSchema } from './magic-link-token.model';
import { UsersSchema } from './users.model';

export const UserModelModule = MongooseModule.forFeature([
  {
    name: 'users',
    schema: UsersSchema,
  },
  {
    name: 'magicLinkTokens',
    schema: MagicLinkTokenSchema,
  },
]);
