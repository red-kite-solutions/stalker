import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CorrelationKeyUtils } from '../../reporting/correlation.utils';
import { SubscriptionTriggersService } from './subscription-triggers.service';

describe('Subscriptions Triggers Service', () => {
  let moduleFixture: TestingModule;
  let triggersService: SubscriptionTriggersService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    triggersService = moduleFixture.get(SubscriptionTriggersService);
    // Without { doNotFake: ['nextTick'] } the tests timeout with fake timers
    jest.useFakeTimers({ doNotFake: ['nextTick'] });
  });

  beforeEach(async () => {
    const allTriggers = await triggersService.getAll();
    for (const t of allTriggers) {
      await triggersService.delete(t._id.toString());
    }
  });

  afterAll(async () => {
    jest.useRealTimers();
    await moduleFixture.close();
  });

  it('Triggers a subscription never triggered before', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Adds a new subscription trigger to the database', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );

    // Act
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);

    // Assert
    const triggers = await triggersService.getAll();
    expect(triggers[0].subscriptionId.toString()).toStrictEqual(subId);
    expect(triggers[0].correlationKey).toStrictEqual(correlationKey);
  });

  it('Triggers a subscription ready to be triggered', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);
    jest.setSystemTime(Date.now() + subInterval * 1000 * 2);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Triggers a subscription ready to be triggered (exact clock)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);
    jest.setSystemTime(Date.now() + subInterval * 1000);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Triggers a subscription ready to be triggered (exact clock +1)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);
    jest.setSystemTime(Date.now() + subInterval * 1000 + 1);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(true);
  });

  it('Fails to trigger a subscription not ready to be triggered (exact clock -1)', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);
    jest.setSystemTime(Date.now() + subInterval * 1000 - 1);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(false);
  });

  it('Ensures that subscription trigger intervals are evaluated as seconds', async () => {
    // Arrange
    const subId = '6574f560570cfc954ccf0b42';
    const companyId = '657e1b45342eb1549b05e4bf';
    const domain = 'example.com';
    const subInterval = 100;
    const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
      companyId,
      domain,
    );
    await triggersService.attemptTrigger(subId, correlationKey, subInterval);
    jest.setSystemTime(Date.now() + subInterval * 10 * 2);

    // Act
    const triggerSuccess = await triggersService.attemptTrigger(
      subId,
      correlationKey,
      subInterval,
    );

    // Assert
    expect(triggerSuccess).toStrictEqual(false);

    const triggers = await triggersService.getAll();
    expect(triggers[0].subscriptionId.toString()).toStrictEqual(subId);
    expect(triggers[0].correlationKey).toStrictEqual(correlationKey);
  });
});
