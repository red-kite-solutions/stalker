import { CorrelationKeyUtils } from './correlation.utils';

describe('Finding utils', () => {
  it('Host findings key', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.hostCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
    );

    // Assert
    expect(correlationKey).toBe(
      `company:507f1f77bcf86cd799439011;host:1.2.3.4`,
    );
  });

  it('Port findings key', () => {
    // Arrange
    // Act
    const correlationId = CorrelationKeyUtils.portCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
    );

    // Assert
    expect(correlationId).toBe(
      `company:507f1f77bcf86cd799439011;host:1.2.3.4;port:443`,
    );
  });

  it('Domain findings key', () => {
    // Arrange
    // Act
    const correlationId = CorrelationKeyUtils.domainCorrelationKey(
      '507f1f77bcf86cd799439011',
      'www.stalker.is',
    );

    // Assert
    expect(correlationId).toBe(
      `company:507f1f77bcf86cd799439011;domain:www.stalker.is`,
    );
  });
});
