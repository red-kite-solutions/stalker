import { cronSubscriptionKey } from 'src/app/api/jobs/subscriptions/cron-subscriptions.service';
import { eventSubscriptionKey } from 'src/app/api/jobs/subscriptions/event-subscriptions.service';
import { LocalizedOption } from 'src/app/shared/types/localized-option.type';

export const subscriptionTypes: LocalizedOption[] = [
  {
    icon: 'bolt',
    value: eventSubscriptionKey,
    text: $localize`:Event subscription|Subscription based on an event:Event Subscription`,
  },
  {
    icon: 'pace',
    value: cronSubscriptionKey,
    text: $localize`:Cron subscription|Subscription based on time:Cron Subscription`,
  },
];

export const eventSubscriptionTemplate = `name: My new event subscription
finding: FindingTypeName
cooldown: 86400
job:
  name: JobName
  parameters:
    - name: ParamName
      value: param value
conditions:
  - lhs: string
    operator: contains
    rhs: ring
`;

export const cronSubscriptionTemplate = `name: My new cron subscription
cronExpression: 0 0 12 * * ?
job:
  name: JobName
  parameters:
  - name: ParamName
    value: param value
`;
