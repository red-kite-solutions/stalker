import { Controller } from '@nestjs/common';
import { SubscriptionTriggersService } from './subscription-triggers.service';

@Controller('subscription-triggers')
export class SubscriptionTriggersController {
  constructor(private subscriptionsService: SubscriptionTriggersService) {}
}
