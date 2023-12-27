import { DevFeatureGuard } from './dev-feature.guard';

describe('Route guards', () => {
  let devFeatureGuard: DevFeatureGuard;

  beforeAll(async () => {
    devFeatureGuard = new DevFeatureGuard();
  });

  beforeEach(async () => {
    process.env.CRON_SERVICE_ENVIRONMENT = 'tests';
  });

  describe('Dev feature guard', () => {
    it('Should not be a valid environment for the dev feature guard (prod)', () => {
      // Arrange
      process.env.CRON_SERVICE_ENVIRONMENT = 'prod';

      //Act
      const ca = devFeatureGuard.canActivate(null);

      //Assert
      expect(ca).toStrictEqual(false);
    });

    it('Should not be a valid environment for the dev feature guard (random string)', () => {
      // Arrange
      process.env.CRON_SERVICE_ENVIRONMENT = 'asdfqwerty';

      //Act
      const ca = devFeatureGuard.canActivate(null);

      //Assert
      expect(ca).toStrictEqual(false);
    });

    it('Should be a valid environment for the dev feature guard (dev)', () => {
      // Arrange
      process.env.CRON_SERVICE_ENVIRONMENT = 'dev';

      //Act
      const ca = devFeatureGuard.canActivate(null);

      //Assert
      expect(ca).toStrictEqual(true);
    });

    it('Should not be a valid environment for the dev feature guard (tests)', () => {
      // Arrange
      process.env.CRON_SERVICE_ENVIRONMENT = 'tests';

      //Act
      const ca = devFeatureGuard.canActivate(null);

      //Assert
      expect(ca).toStrictEqual(true);
    });
  });
});
